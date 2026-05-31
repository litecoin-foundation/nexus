import {Platform} from 'react-native';
import {
  createJadeDevice,
  JadeConnectionState,
  litecoinNetwork,
  type JadeBleDevice,
  type JadeDevice,
  type JadeUsbDevice,
  type JadeVersionInfo,
} from 'react-native-nitro-jade';

// App is Litecoin mainnet-only, so every Jade RPC uses this network string.
const JADE_NETWORK = litecoinNetwork('mainnet');

// getVersionInfo().jadeState for a device with no seed — must be set up first.
const JADE_STATE_UNINITIALIZED = 'UNINIT';

export type JadeTransport = 'ble' | 'usb';

// Immutable snapshot for useSyncExternalStore; replaced (never mutated) on change.
export interface JadeServiceSnapshot {
  state: JadeConnectionState;
  versionInfo: JadeVersionInfo | null;
  lastError: Error | null;
}

const INITIAL_SNAPSHOT: JadeServiceSnapshot = {
  state: JadeConnectionState.DISCONNECTED,
  versionInfo: null,
  lastError: null,
};

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

// Public contract for the provider, hook, and tests — keeps the class's queue,
// snapshot, and listeners private and lets DI doubles stay simple.
export interface JadeServiceApi {
  subscribe(listener: () => void): () => void;
  getSnapshot(): JadeServiceSnapshot;
  scan(timeoutSeconds: number): Promise<JadeBleDevice[]>;
  listUsb(): Promise<JadeUsbDevice[]>;
  connect(params: {
    deviceId: string;
    transport: JadeTransport;
  }): Promise<JadeVersionInfo>;
  disconnect(): Promise<void>;
  withDevice<T>(fn: (device: JadeDevice) => Promise<T>): Promise<T>;
}

/**
 * Singleton wrapping the native Jade device. The device has no event stream, so
 * the service owns the JS connection-state machine and pushes changes to React
 * via useSyncExternalStore. The native object is created lazily, so importing
 * this module (provider mount, jest) touches no native code.
 */
class JadeService implements JadeServiceApi {
  private jade: JadeDevice | null = null;
  private snapshot: JadeServiceSnapshot = INITIAL_SNAPSHOT;
  private readonly listeners = new Set<() => void>();
  // Serialises every native-touching op (the device handles one RPC at a time)
  // so no two native calls overlap and a lifecycle change can't race an RPC.
  private queue: Promise<unknown> = Promise.resolve();

  // Run a native op behind any in-flight one; failures are isolated so a rejected
  // task never poisons later callers.
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.queue.then(operation);
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private getJade(): JadeDevice {
    if (!this.jade) {
      this.jade = createJadeDevice();
    }
    return this.jade;
  }

  private emit(patch: Partial<JadeServiceSnapshot>): void {
    const next = {...this.snapshot, ...patch};
    // Skip no-op emits so useSyncExternalStore consumers don't re-render needlessly.
    if (
      next.state === this.snapshot.state &&
      next.versionInfo === this.snapshot.versionInfo &&
      next.lastError === this.snapshot.lastError
    ) {
      return;
    }
    this.snapshot = next;
    this.listeners.forEach(listener => listener());
  }

  // Shared "link down" reset: connect failure, disconnect, and withDevice drops.
  private emitDisconnected(lastError: Error | null): void {
    this.emit({
      state: JadeConnectionState.DISCONNECTED,
      versionInfo: null,
      lastError,
    });
  }

  // The native layer can't signal a silent BLE/USB drop, so reconcile to
  // DISCONNECTED whenever we touch the device and find connectionState gone.
  private reconcileIfDropped(jade: JadeDevice, lastError: Error): void {
    if (
      jade.connectionState === JadeConnectionState.DISCONNECTED &&
      this.snapshot.state !== JadeConnectionState.DISCONNECTED
    ) {
      this.emitDisconnected(lastError);
    }
  }

  // ---- external store ----

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): JadeServiceSnapshot => this.snapshot;

  // ---- discovery ----

  scan = (timeoutSeconds: number): Promise<JadeBleDevice[]> =>
    this.enqueue(async () => {
      // Only scan from a clean disconnected state to avoid desyncing the snapshot.
      if (this.snapshot.state !== JadeConnectionState.DISCONNECTED) {
        throw new Error('Jade is busy; cannot start a scan');
      }
      this.emit({state: JadeConnectionState.SCANNING, lastError: null});
      try {
        const devices = await this.getJade().scanForDevices(timeoutSeconds);
        this.emit({state: JadeConnectionState.DISCONNECTED});
        return devices;
      } catch (error) {
        const err = toError(error);
        this.emit({state: JadeConnectionState.DISCONNECTED, lastError: err});
        throw err;
      }
    });

  listUsb = (): Promise<JadeUsbDevice[]> => {
    // USB is Android-only.
    if (Platform.OS !== 'android') {
      return Promise.resolve([]);
    }
    return this.enqueue(() => this.getJade().listUsbDevices());
  };

  // ---- connect / authenticate ----

  connect = ({
    deviceId,
    transport,
  }: {
    deviceId: string;
    transport: JadeTransport;
  }): Promise<JadeVersionInfo> =>
    this.enqueue(async () => {
      // Require a clean start; a concurrent connect would race the device and let
      // the loser's catch path clobber the winner. disconnect() resets.
      if (this.snapshot.state !== JadeConnectionState.DISCONNECTED) {
        throw new Error('A Jade connection is already in progress');
      }
      const jade = this.getJade();
      this.emit({
        state: JadeConnectionState.CONNECTING,
        lastError: null,
        versionInfo: null,
      });
      try {
        if (transport === 'usb') {
          if (Platform.OS !== 'android') {
            throw new Error('USB connection is only supported on Android');
          }
          await jade.connectUSB(deviceId);
        } else {
          await jade.connectBLE(deviceId);
        }
        this.emit({state: JadeConnectionState.CONNECTED});

        const versionInfo = await jade.getVersionInfo();
        this.emit({versionInfo});

        // An uninitialised Jade has no seed; authenticating would start on-device
        // setup. Return the version info so the caller can route to the hint.
        if (versionInfo.jadeState === JADE_STATE_UNINITIALIZED) {
          return versionInfo;
        }

        this.emit({state: JadeConnectionState.AUTHENTICATING});
        const authenticated = await jade.authUser(JADE_NETWORK);
        if (!authenticated) {
          throw new Error('Jade authentication failed: incorrect PIN');
        }
        // Re-read after auth: jadeState flips LOCKED→READY, so the pre-auth value
        // would report READY with a stale jadeState.
        const readyVersionInfo = await jade.getVersionInfo();
        this.emit({
          state: JadeConnectionState.READY,
          versionInfo: readyVersionInfo,
        });
        return readyVersionInfo;
      } catch (error) {
        const err = toError(error);
        // Best-effort teardown of a half-open transport; the original error wins.
        await jade.disconnect().catch(() => undefined);
        this.emitDisconnected(err);
        throw err;
      }
    });

  disconnect = (): Promise<void> =>
    this.enqueue(async () => {
      try {
        await this.jade?.disconnect();
      } catch (error) {
        console.error('Jade disconnect error:', error);
      } finally {
        this.emitDisconnected(null);
      }
    });

  // ---- serialised device access ----

  /**
   * Run an authenticated device op, serialised behind any in-flight call; rejects
   * unless connected and READY. `fn` must only use the passed native `device`,
   * never call back into this service — that deadlocks the held queue slot.
   * `buildWatchOnlyBundle` runs two RPCs via Promise.all; keep it top-level.
   */
  withDevice = <T>(fn: (device: JadeDevice) => Promise<T>): Promise<T> => {
    if (!this.jade || this.snapshot.state !== JadeConnectionState.READY) {
      return Promise.reject(new Error('Jade is not connected'));
    }
    const jade = this.jade;
    return this.enqueue(async () => {
      // connectionState is authoritative (both platforms set READY after auth);
      // the link may have dropped since enqueue, so never forward to a dead device.
      if (jade.connectionState !== JadeConnectionState.READY) {
        this.reconcileIfDropped(jade, new Error('Jade disconnected'));
        throw new Error('Jade is not connected');
      }
      try {
        return await fn(jade);
      } catch (error) {
        // Reconcile if the link dropped mid-op so the UI doesn't hang on READY.
        this.reconcileIfDropped(jade, toError(error));
        throw error;
      }
    });
  };
}

export const jadeService: JadeServiceApi = new JadeService();
