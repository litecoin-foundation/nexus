import {processConvertTransactions} from './convertTransactionProcessor';
import {IConvertedTx} from '../reducers/transaction';

describe('processConvertTransactions', () => {
  const mockGetPriceOnDate = jest.fn().mockResolvedValue(50000);

  const convertTx: IConvertedTx = {
    destinationAddress: 'ltc1qlxu4hknq44z5pxn2kc5c7vgsayhkmlptdskg5j',
    targetAmount: 600000000,
    timestamp: 1754818308,
    conversionType: 'regular',
    selectedUtxos: [
      {
        address:
          'ltcmweb1qqgwyejyugm783aldxdk0jwwcmv4pxxyn5m0ra4sg0mne0dvu0hc6wqnd9fdj6wma0sawycmjyhd3knmxjt5gezs62659qfldq5yf6pga9qw025wj',
        amountSat: 494823407,
        addressType: 6,
      },
      {
        address:
          'ltcmweb1qqgfz3y4a3zuxm4muac6qzjhj93tgxfqkyzkqaxefc97j0r4ukrxyzqhzyhl8a4cnwffdtutwa46j80ruu04medu0xqn083hrlrpl2c9hvq78d65d',
        amountSat: 160616347,
        addressType: 6,
      },
    ],
    selectedOutpoints: [
      '1b5321e1b9025a17af4e2b9523c98a824b0073d417581b71e639ed0a25547106:0',
      '2005bf0e73ee3827dd1b8e3d2e7be94d254948c47ed4cbc9de67785e5fdaa172:0',
    ],
  };

  const realTransactions = {
    transactions: [
      // TX1 - Send transaction
      {
        txHash:
          'fdeff5304f63faf07b26f574e501c200dbf9453a5ecbe60c2354cf12677f44b3',
        amount: BigInt(-655439754), // Negative (send)
        blockHash:
          'e672473a1a54eac6fa8a8144e6be01374d40025fb4396fa8d5050993dda30879',
        blockHeight: 2947602,
        outputDetails: [], // EMPTY - this is the issue!
        previousOutpoints: [
          {
            outpoint:
              '1b5321e1b9025a17af4e2b9523c98a824b0073d417581b71e639ed0a25547106:0',
            isOurOutput: true,
          },
          {
            outpoint:
              '2005bf0e73ee3827dd1b8e3d2e7be94d254948c47ed4cbc9de67785e5fdaa172:0',
            isOurOutput: true,
          },
        ],
        timeStamp: BigInt(1754818971),
        totalFees: BigInt(1000000),
        label: '',
        numConfirmations: 6,
      },
      // TX2 - Main convert receive transaction
      {
        txHash:
          '09ae159397480c6c9995aa0e76ec45ff6f83766a7967dab1d88f91a1838b597a',
        amount: BigInt(600000000), // Positive (receive) - matches target amount
        blockHash:
          'fa144e3abe249ec294e77359fa1633d880dae57d7463923ea87b97018ab38200',
        blockHeight: 2947599,
        outputDetails: [
          {
            address:
              'ltc1gasazujhc3s9kylgppljerpqx0vp7d4vc2t8ek2vcaxnn8kgcc0as28k7fs',
            amount: 17274751704039,
            isOurAddress: false,
            outputIndex: 0,
            outputType: 10,
            pkScript: 'script1',
          },
          {
            address: 'ltc1qlxu4hknq44z5pxn2kc5c7vgsayhkmlptdskg5j', // DESTINATION ADDRESS
            amount: 600000000,
            isOurAddress: true,
            outputIndex: 1,
            outputType: 2,
            pkScript: 'script2',
          },
          {
            address: 'LP3SFCDkcA6nE8RJhug29XZnyTcRqHUKxf',
            amount: 289940000,
            isOurAddress: false,
            outputIndex: 2,
            outputType: 0,
            pkScript: 'script3',
          },
        ],
        previousOutpoints: [
          {
            outpoint:
              'ddc4a429c1797c37f8e70301e183e1df19934b4d43153156dbbcbb2a1715db5c:0',
            isOurOutput: false,
          },
        ],
        timeStamp: BigInt(1754818532),
        totalFees: BigInt(2000000),
        label: '',
        numConfirmations: 6,
      },
      // TX3 - Change receive transaction
      {
        txHash:
          '4d53d3e11bdc6dbfcbfe3090b1973dc2620cdcf3768749eeba4809b1c9a21894',
        amount: BigInt(55419654), // Positive (receive) - change amount
        blockHash:
          'fa144e3abe249ec294e77359fa1633d880dae57d7463923ea87b97018ab38200',
        blockHeight: 2947599, // Same block as TX2
        outputDetails: [
          {
            address:
              'ltcmweb1qqgwyejyugm783aldxdk0jwwcmv4pxxyn5m0ra4sg0mne0dvu0hc6wqnd9fdj6wma0sawycmjyhd3knmxjt5gezs62659qfldq5yf6pga9qw025wj', // CHANGE ADDRESS (matches selectedUtxos[0])
            amount: 55419654,
            isOurAddress: true,
            outputIndex: 0,
            outputType: 12,
            pkScript: 'script4',
          },
        ],
        previousOutpoints: [],
        timeStamp: BigInt(1754818532),
        totalFees: BigInt(500000),
        label: '',
        numConfirmations: 6,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process convert transactions and find all related transactions', async () => {
    const result = await processConvertTransactions(
      [convertTx],
      realTransactions,
      mockGetPriceOnDate,
    );

    expect(result.processedTransactions).toHaveLength(1);
    expect(result.processedTxHashes.size).toBe(3); // All 3 transactions should be marked as processed

    const processedTx = result.processedTransactions[0];
    expect(processedTx.txHash).toBe(
      '09ae159397480c6c9995aa0e76ec45ff6f83766a7967dab1d88f91a1838b597a',
    );
    expect(processedTx.metaLabel).toBe('Convert');
    expect(processedTx.tradeTx.destinationAddress).toBe(
      convertTx.destinationAddress,
    );
    expect(processedTx.tradeTx.targetAmount).toBe(convertTx.targetAmount);
    expect(processedTx.tradeTx.conversionType).toBe('regular');
  });

  it('should find main convert transaction by destination address', async () => {
    const result = await processConvertTransactions(
      [convertTx],
      realTransactions,
      mockGetPriceOnDate,
    );

    const processedTx = result.processedTransactions[0];

    // Should use the main convert transaction (TX2) as the base
    expect(processedTx.txHash).toBe(
      '09ae159397480c6c9995aa0e76ec45ff6f83766a7967dab1d88f91a1838b597a',
    );
    expect(processedTx.blockHeight).toBe(2947599);
    expect(processedTx.amount).toBe(600000000);
  });

  it('should include transaction that uses selected UTXOs by amount', async () => {
    const result = await processConvertTransactions(
      [convertTx],
      realTransactions,
      mockGetPriceOnDate,
    );

    // TX1 uses selected UTXOs (total amount matches)
    const totalSelectedAmount = convertTx.selectedUtxos.reduce(
      (sum, utxo) => sum + utxo.amountSat,
      0,
    );
    expect(totalSelectedAmount).toBe(655439754);

    // TX1 amount should match total selected (as negative)
    const tx1 = realTransactions.transactions[0];
    expect(Math.abs(Number(tx1.amount))).toBe(totalSelectedAmount);

    // Verify TX1 is included in processed hashes
    expect(result.processedTxHashes.has(tx1.txHash!)).toBe(true);
  });

  it('should include same-block receive transactions with MWEB change', async () => {
    const result = await processConvertTransactions(
      [convertTx],
      realTransactions,
      mockGetPriceOnDate,
    );

    // TX3 should be included because:
    // 1. Same block as main convert (2947599)
    // 2. Positive amount (receive)
    // 3. Has outputType 12 (MWEB)
    // 4. No previous outpoints (looks like receive)
    // 5. Amount is within change budget tolerance

    expect(
      result.processedTxHashes.has(
        '4d53d3e11bdc6dbfcbfe3090b1973dc2620cdcf3768749eeba4809b1c9a21894',
      ),
    ).toBe(true);
  });

  it('should merge output details from all related transactions', async () => {
    const result = await processConvertTransactions(
      [convertTx],
      realTransactions,
      mockGetPriceOnDate,
    );

    const processedTx = result.processedTransactions[0];

    // Should have outputs from TX2 (3 outputs) and TX3 (1 output) = 4 unique outputs
    expect(processedTx.outputDetails).toHaveLength(4);

    // Check that all expected addresses are present
    const addresses = processedTx.outputDetails.map(output => output.address);
    expect(addresses).toContain(
      'ltc1gasazujhc3s9kylgppljerpqx0vp7d4vc2t8ek2vcaxnn8kgcc0as28k7fs',
    );
    expect(addresses).toContain('ltc1qlxu4hknq44z5pxn2kc5c7vgsayhkmlptdskg5j'); // Destination
    expect(addresses).toContain('LP3SFCDkcA6nE8RJhug29XZnyTcRqHUKxf');
    expect(addresses).toContain(
      'ltcmweb1qqgwyejyugm783aldxdk0jwwcmv4pxxyn5m0ra4sg0mne0dvu0hc6wqnd9fdj6wma0sawycmjyhd3knmxjt5gezs62659qfldq5yf6pga9qw025wj',
    ); // Change
  });

  it('should deduplicate outputs by address', async () => {
    // Create a test case where the same address appears in multiple transactions
    const txsWithDuplicateAddress = {
      transactions: [
        ...realTransactions.transactions,
        // Add a transaction with duplicate address
        {
          txHash: 'duplicate-tx',
          amount: BigInt(100000),
          blockHash:
            'fa144e3abe249ec294e77359fa1633d880dae57d7463923ea87b97018ab38200',
          blockHeight: 2947599,
          outputDetails: [
            {
              address: 'ltc1qlxu4hknq44z5pxn2kc5c7vgsayhkmlptdskg5j', // Same as destination
              amount: 100000,
              isOurAddress: true,
              outputIndex: 0,
              outputType: 2,
              pkScript: 'duplicate-script',
            },
          ],
          previousOutpoints: [],
          timeStamp: BigInt(1754818532),
          totalFees: BigInt(0),
          label: '',
          numConfirmations: 6,
        },
      ],
    };

    const result = await processConvertTransactions(
      [convertTx],
      txsWithDuplicateAddress,
      mockGetPriceOnDate,
    );

    const processedTx = result.processedTransactions[0];

    // Should still have only 4 unique addresses (deduplication should work)
    const addresses = processedTx.outputDetails.map(output => output.address);
    const uniqueAddresses = new Set(addresses);
    expect(uniqueAddresses.size).toBe(addresses.length);
    expect(
      addresses.filter(
        addr => addr === 'ltc1qlxu4hknq44z5pxn2kc5c7vgsayhkmlptdskg5j',
      ),
    ).toHaveLength(1);
  });

  it('should calculate total fees from all related transactions', async () => {
    const result = await processConvertTransactions(
      [convertTx],
      realTransactions,
      mockGetPriceOnDate,
    );

    const processedTx = result.processedTransactions[0];

    // Total fees should be sum of all related transactions
    // TX1: 1000000, TX2: 2000000, TX3: 500000 = 3500000
    expect(processedTx.tradeTx.totalFees).toBe(3500000);
  });

  it('should identify send and receive transaction hashes', async () => {
    const result = await processConvertTransactions(
      [convertTx],
      realTransactions,
      mockGetPriceOnDate,
    );

    const processedTx = result.processedTransactions[0];

    // Should identify TX1 as send transaction (negative amount)
    expect(processedTx.tradeTx.sendTxHash).toBe(
      'fdeff5304f63faf07b26f574e501c200dbf9453a5ecbe60c2354cf12677f44b3',
    );

    // Should identify TX2 as receive transaction (positive amount + destination address + amount matches target)
    expect(processedTx.tradeTx.receiveTxHash).toBe(
      '09ae159397480c6c9995aa0e76ec45ff6f83766a7967dab1d88f91a1838b597a',
    );
  });

  it('should handle empty converted transactions array', async () => {
    const result = await processConvertTransactions(
      [],
      realTransactions,
      mockGetPriceOnDate,
    );

    expect(result.processedTransactions).toHaveLength(0);
    expect(result.processedTxHashes.size).toBe(0);
  });

  it('should skip convert transactions without main convert transaction', async () => {
    const convertTxWithoutMain: IConvertedTx = {
      ...convertTx,
      destinationAddress: 'nonexistent-address',
    };

    const result = await processConvertTransactions(
      [convertTxWithoutMain],
      realTransactions,
      mockGetPriceOnDate,
    );

    expect(result.processedTransactions).toHaveLength(0);
    expect(result.processedTxHashes.size).toBe(0);
  });

  it('should handle duplicate convert transactions', async () => {
    const duplicateConvertTx = [...Array(3)].map(() => ({...convertTx}));

    const result = await processConvertTransactions(
      duplicateConvertTx,
      realTransactions,
      mockGetPriceOnDate,
    );

    // Should only process once due to deduplication by convertKey
    expect(result.processedTransactions).toHaveLength(1);
    expect(result.processedTxHashes.size).toBe(3);
  });

  it('should call getPriceOnDate with correct timestamp', async () => {
    await processConvertTransactions(
      [convertTx],
      realTransactions,
      mockGetPriceOnDate,
    );

    // Should call with main convert transaction timestamp (TX2)
    expect(mockGetPriceOnDate).toHaveBeenCalledWith(1754818532);
    expect(mockGetPriceOnDate).toHaveBeenCalledTimes(1);
  });

  it('should set priceOnDate to 0 when getPriceOnDate returns null', async () => {
    const nullPriceGetPriceOnDate = jest.fn().mockResolvedValue(null);

    const result = await processConvertTransactions(
      [convertTx],
      realTransactions,
      nullPriceGetPriceOnDate,
    );

    expect(result.processedTransactions[0].priceOnDate).toBe(0);
  });

  // Additional comprehensive tests with real transaction data
  describe('Real transaction data tests', () => {
    const additionalConvertTxs: IConvertedTx[] = [
      // Convert TX 1: ltc1qgc8kd8f8cd4ghznw92fhc72ycrlzp93ugsm99h (1 LTC target)
      {
        conversionType: 'regular',
        destinationAddress: 'ltc1qgc8kd8f8cd4ghznw92fhc72ycrlzp93ugsm99h',
        selectedOutpoints: [
          '9418a2c9b10948baee498776f3dc0c62c23d97b19030fecbbf6ddc1be1d3534d:0',
          '0e2909713fbe21b551e77a9f658f105fd355398d4539eb436c3351b13e10ab78:0',
          '661a22f41a313438781ed55c57d3fc72425616eaf09eaa4a333dbed6b0055811:0',
        ],
        selectedUtxos: [
          {
            address:
              'ltcmweb1qqgwyejyugm783aldxdk0jwwcmv4pxxyn5m0ra4sg0mne0dvu0hc6wqnd9fdj6wma0sawycmjyhd3knmxjt5gezs62659qfldq5yf6pga9qw025wj',
            amountSat: 55419654,
            addressType: 6,
          },
          {
            address:
              'ltcmweb1qqw2dkg77ekn7r0exy6788q3n5lzqq9z50338q46w6nhnmz4pwuks2qhmglcsnsr9dkn294pzv95hzmqq9l0mqwd0w2yynghj0hxav9uyxg6rlhkc',
            amountSat: 39979900,
            addressType: 6,
          },
          {
            address:
              'ltcmweb1qqw55czgfd60mgq9063l3mep5wsmmcvdtrfw53k2e0th7f38a6hlzqqnjwkqgrnmsdj4nu72daqdzfp9euhs6v8c3547hzseqa0adnqfnluxjy2mh',
            amountSat: 9050796,
            addressType: 6,
          },
        ],
        targetAmount: 100000000,
        timestamp: 1754927783,
      },
      // Convert TX 2: ltc1qdze7y7chruzccmegt6tu0ewrltjm7k7xtux6us (0.04 LTC target)
      {
        conversionType: 'regular',
        destinationAddress: 'ltc1qdze7y7chruzccmegt6tu0ewrltjm7k7xtux6us',
        selectedOutpoints: [
          'bcfb328017ff7299f7ed48a57ad2174bfa163cbef18fdd37af014758e8b6cf6c:0',
        ],
        selectedUtxos: [
          {
            address:
              'ltcmweb1qq22pdzz8vc6h06hawcmutm3hgu4x35anjwhygz3fuzfr46070794kqjf5mzr40ddxt5rrr7a0qprtcdgs0wzdxl72fevyzr5dm97t3smactj2muf',
            amountSat: 4430250,
            addressType: 6,
          },
        ],
        targetAmount: 4000000,
        timestamp: 1754932187,
      },
      // Convert TX 3: ltc1qgdytp7lyhfl7tpg6cpm67zmgh6k28gv0a29t8e (0.005 LTC target)
      {
        conversionType: 'regular',
        destinationAddress: 'ltc1qgdytp7lyhfl7tpg6cpm67zmgh6k28gv0a29t8e',
        selectedOutpoints: [
          '51b84f87512b030b603006aef20b5e65d9464b02404123dd97702ad9cdcdfc1a:0',
          '832535794ac9488c9db1bbc7c3d9859c57feded783bcd675db1e0216047244af:0',
        ],
        selectedUtxos: [
          {
            address:
              'ltcmweb1qqw55czgfd60mgq9063l3mep5wsmmcvdtrfw53k2e0th7f38a6hlzqqnjwkqgrnmsdj4nu72daqdzfp9euhs6v8c3547hzseqa0adnqfnluxjy2mh',
            amountSat: 410150,
            addressType: 6,
          },
          {
            address:
              'ltcmweb1qq0l2z6ka7nk8yv2wflmvf62jpg2ud9mywcmhr0vvkanwhg9pptes7qmxm0ujztp4sm4zw99x2e7c0ga3l3496qhejj9e7djlj9ymedc00yjlvhrh',
            amountSat: 356900,
            addressType: 6,
          },
        ],
        targetAmount: 500000,
        timestamp: 1754932400,
      },
    ];

    const additionalTransactions = {
      transactions: [
        // TX1: Convert 1 - receive main (1 LTC)
        {
          txHash:
            'bca6a4da0cdc1609381f6643f1c4ade8fd6e6367a480ad1e44f9384a0ebc9364',
          amount: BigInt(100000000),
          blockHash:
            'e1ff6ccda20d1d05f9c84e370723270deda3ffe3094abb77db8fa3d265480b50',
          blockHeight: 2948379,
          outputDetails: [
            {
              address:
                'ltc1g2zcd2rt0plqfmfzq50p9cjsjwtdmeq4xedlrc7uwmxjupwxtd6sqkljls9',
              amount: BigInt(17329660131505),
              isOurAddress: false,
              outputIndex: BigInt(0),
              outputType: 10,
              pkScript:
                '582050b0d50d6f0fc09da440a3c25c4a1272dbbc82a6cb7e3c7b8ed9a5c0b8cb6ea0',
            },
            {
              address: 'ltc1qgc8kd8f8cd4ghznw92fhc72ycrlzp93ugsm99h', // DESTINATION
              amount: BigInt(100000000),
              isOurAddress: true,
              outputIndex: BigInt(1),
              outputType: 2,
              pkScript: '0014460f669d27c36a8b8a6e2a937c7944c0fe20963c',
            },
          ],
          previousOutpoints: [
            {
              outpoint:
                'd819ada5ab989aa17f37e78e61b0f41478f197d1c00251b2b25d7c337788210f:0',
              isOurOutput: false,
            },
          ],
          timeStamp: BigInt(1754927872),
          totalFees: BigInt(0),
          label: '',
          numConfirmations: 170,
        },
        // TX2: Convert 1 - change receive (MWEB)
        {
          txHash:
            '6ccfb6e8584701af37dd8ff1be3c16fa4b17d27aa548edf79972ff178032fbbc',
          amount: BigInt(4430250),
          blockHash:
            'e1ff6ccda20d1d05f9c84e370723270deda3ffe3094abb77db8fa3d265480b50',
          blockHeight: 2948379, // Same block as TX1
          outputDetails: [
            {
              address:
                'ltcmweb1qq22pdzz8vc6h06hawcmutm3hgu4x35anjwhygz3fuzfr46070794kqjf5mzr40ddxt5rrr7a0qprtcdgs0wzdxl72fevyzr5dm97t3smactj2muf',
              amount: BigInt(4430250),
              isOurAddress: true,
              outputIndex: BigInt(0),
              outputType: 12, // MWEB
              pkScript:
                '0294168847663577eafd7637c5ee37472a68d3b393ae440a29e0923ae9fe7f8b5b0249a6c43abdad32e8318fdd780235e1a883dc269bfe5272c208746ecbe5c61bee',
            },
          ],
          previousOutpoints: [],
          timeStamp: BigInt(1754927872),
          totalFees: BigInt(0),
          label: '',
          numConfirmations: 170,
        },
        // TX3: Convert 1 - send transaction (uses selected UTXOs)
        {
          txHash:
            '00eb7fa499ad65061e93b2f9234290666438d131c5602c826496e2b4bbd74760',
          amount: BigInt(-104450350), // Negative (send) - matches total selected UTXOs
          blockHash:
            'a2d85f1714b71230dfd9e198f2320255724840046e4ead8abd9325c9440696e1',
          blockHeight: 2948389,
          outputDetails: [], // Empty as expected for send
          previousOutpoints: [
            {
              outpoint:
                '78ab103eb151336c43eb39458d3955d35f108f659f7ae751b521be3f7109290e:0',
              isOurOutput: true,
            },
            {
              outpoint:
                '115805b0d6be3d334aaa9ef0ea16564272fcd3575cd51e783834311af4221a66:0',
              isOurOutput: true,
            },
            {
              outpoint:
                '4d53d3e11bdc6dbfcbfe3090b1973dc2620cdcf3768749eeba4809b1c9a21894:0',
              isOurOutput: true,
            },
          ],
          timeStamp: BigInt(1754928534),
          totalFees: BigInt(104450350),
          label: '',
          numConfirmations: 160,
        },
        // TX4: Convert 2 - receive main (0.04 LTC)
        {
          txHash:
            '4c1150c8d222e4b54690f2b83f771d0a56d9e316df0e1db4af859e89bbb3ed9e',
          amount: BigInt(4000000),
          blockHash:
            'a8c0214900b8ab7407ef60064042d3bf1d9ce3879c8c1705b7fbf494d6f67ca7',
          blockHeight: 2948419,
          outputDetails: [
            {
              address:
                'ltc1gyyxmeyttwncav9lzxr8auuyrk8s0aatzzv89uv6xdpv85jcjn9pqgl88au',
              amount: BigInt(17325052314067),
              isOurAddress: false,
              outputIndex: BigInt(0),
              outputType: 10,
              pkScript:
                '5820210dbc916b74f1d617e230cfde7083b1e0fef562130e5e334668587a4b129942',
            },
            {
              address: 'ltc1qdze7y7chruzccmegt6tu0ewrltjm7k7xtux6us', // DESTINATION
              amount: BigInt(4000000),
              isOurAddress: true,
              outputIndex: BigInt(1),
              outputType: 2,
              pkScript: '001468b3e27b171f058c6f285e97c7e5c3fae5bf5bc6',
            },
          ],
          previousOutpoints: [
            {
              outpoint:
                'a41def1ca8df9c1a31826f8c69b577ab2f3e7f55ada936c2b87b67186a77ad83:0',
              isOurOutput: false,
            },
          ],
          timeStamp: BigInt(1754932274),
          totalFees: BigInt(0),
          label: '',
          numConfirmations: 119,
        },
        // TX5: Convert 2 - change receive (MWEB)
        {
          txHash:
            '1afccdcdd92a7097dd234140024b46d9655e0bf2ae0630600b032b51874fb851',
          amount: BigInt(410150),
          blockHash:
            'a8c0214900b8ab7407ef60064042d3bf1d9ce3879c8c1705b7fbf494d6f67ca7',
          blockHeight: 2948419, // Same block as TX4
          outputDetails: [
            {
              address:
                'ltcmweb1qqw55czgfd60mgq9063l3mep5wsmmcvdtrfw53k2e0th7f38a6hlzqqnjwkqgrnmsdj4nu72daqdzfp9euhs6v8c3547hzseqa0adnqfnluxjy2mh',
              amount: BigInt(410150),
              isOurAddress: true,
              outputIndex: BigInt(0),
              outputType: 12, // MWEB
              pkScript:
                '03a94c09096e9fb400afd47f1de4347437bc31ab1a5d48d9597aefe4c4fdd5fe200272758081cf706cab3e794de81a2484b9e5e1a61f11a57d714320ebfad98133ff',
            },
          ],
          previousOutpoints: [],
          timeStamp: BigInt(1754932274),
          totalFees: BigInt(0),
          label: '',
          numConfirmations: 119,
        },
        // TX6: Convert 3 - receive main (0.005 LTC)
        {
          txHash:
            '19936c98e5e858761d7cf048518d454522c23d4763ebfa413356a0133e647fb0',
          amount: BigInt(500000),
          blockHash:
            '38b3b291a0b4ca94cf78940f05599677fe1f845ee3081cc450721cd8f3745952',
          blockHeight: 2948421,
          outputDetails: [
            {
              address:
                'ltc1gve9q830gjgfwasdsy890l75l4467grx4hxke399ryzulzqyagpcs6vlsgz',
              amount: BigInt(17325051790067),
              isOurAddress: false,
              outputIndex: BigInt(0),
              outputType: 10,
              pkScript:
                '5820664a03c5e89212eec1b021cafffa9fad75e40cd5b9ad9894a320b9f1009d4071',
            },
            {
              address: 'ltc1qgdytp7lyhfl7tpg6cpm67zmgh6k28gv0a29t8e', // DESTINATION
              amount: BigInt(500000),
              isOurAddress: true,
              outputIndex: BigInt(1),
              outputType: 2,
              pkScript: '00144348b0fbe4ba7fe5851ac077af0b68beaca3a18f',
            },
          ],
          previousOutpoints: [
            {
              outpoint:
                'c9f2e9dc72bf56d15c13c95a44cfa7da4084c522d5a6f51d78f8d1fbf605c07c:0',
              isOurOutput: false,
            },
          ],
          timeStamp: BigInt(1754932535),
          totalFees: BigInt(0),
          label: '',
          numConfirmations: 117,
        },
        // TX7: Convert 3 - change receive (MWEB)
        {
          txHash:
            'e34cc74c9b254624565a2d4bf79bd6c67508c8714e32756b3e919c982a092f42',
          amount: BigInt(246950),
          blockHash:
            '38b3b291a0b4ca94cf78940f05599677fe1f845ee3081cc450721cd8f3745952',
          blockHeight: 2948421, // Same block as TX6
          outputDetails: [
            {
              address:
                'ltcmweb1qqtprteuazdnw7g5ymta03jqcuygag5p8plj3lhld5gpy2jwvfanyjqmfuc28cmjpmprrfglkdzm5hucpa796gxhmm88xdpd94de0w3wd5gahswlr',
              amount: BigInt(246950),
              isOurAddress: true,
              outputIndex: BigInt(0),
              outputType: 12, // MWEB
              pkScript:
                '02c235e79d1366ef2284dafaf8c818e111d450270fe51fdfeda2024549cc4f66490369e6147c6e41d84634a3f668b74bf301ef8ba41afbd9ce6685a5ab72f745cda2',
            },
          ],
          previousOutpoints: [],
          timeStamp: BigInt(1754932535),
          totalFees: BigInt(0),
          label: '',
          numConfirmations: 117,
        },
      ],
    };

    it('should process multiple convert transactions simultaneously', async () => {
      const result = await processConvertTransactions(
        additionalConvertTxs,
        additionalTransactions,
        mockGetPriceOnDate,
      );

      // Should process all 3 convert transactions
      expect(result.processedTransactions).toHaveLength(3);

      // Should mark 7 transaction hashes as processed (TX1-TX7)
      expect(result.processedTxHashes.size).toBe(7);

      // Verify each convert transaction was processed correctly
      const convertTx1 = result.processedTransactions.find(
        tx =>
          tx.tradeTx.destinationAddress ===
          'ltc1qgc8kd8f8cd4ghznw92fhc72ycrlzp93ugsm99h',
      );
      const convertTx2 = result.processedTransactions.find(
        tx =>
          tx.tradeTx.destinationAddress ===
          'ltc1qdze7y7chruzccmegt6tu0ewrltjm7k7xtux6us',
      );
      const convertTx3 = result.processedTransactions.find(
        tx =>
          tx.tradeTx.destinationAddress ===
          'ltc1qgdytp7lyhfl7tpg6cpm67zmgh6k28gv0a29t8e',
      );

      expect(convertTx1).toBeDefined();
      expect(convertTx2).toBeDefined();
      expect(convertTx3).toBeDefined();

      expect(convertTx1!.tradeTx.targetAmount).toBe(100000000); // 1 LTC
      expect(convertTx2!.tradeTx.targetAmount).toBe(4000000); // 0.04 LTC
      expect(convertTx3!.tradeTx.targetAmount).toBe(500000); // 0.005 LTC
    });

    it('should correctly merge outputs for 1 LTC convert transaction', async () => {
      const result = await processConvertTransactions(
        [additionalConvertTxs[0]], // 1 LTC convert
        additionalTransactions,
        mockGetPriceOnDate,
      );

      const processedTx = result.processedTransactions[0];

      // Should merge outputs from main receive (TX1) + MWEB change (TX2) = 3 outputs
      expect(processedTx.outputDetails).toHaveLength(3);

      const addresses = processedTx.outputDetails.map(output => output.address);
      expect(addresses).toContain(
        'ltc1g2zcd2rt0plqfmfzq50p9cjsjwtdmeq4xedlrc7uwmxjupwxtd6sqkljls9',
      ); // External
      expect(addresses).toContain(
        'ltc1qgc8kd8f8cd4ghznw92fhc72ycrlzp93ugsm99h',
      ); // Destination
      expect(addresses).toContain(
        'ltcmweb1qq22pdzz8vc6h06hawcmutm3hgu4x35anjwhygz3fuzfr46070794kqjf5mzr40ddxt5rrr7a0qprtcdgs0wzdxl72fevyzr5dm97t3smactj2muf',
      ); // MWEB change
    });

    it('should correctly identify send transaction by selected outpoints', async () => {
      const result = await processConvertTransactions(
        [additionalConvertTxs[0]], // 1 LTC convert
        additionalTransactions,
        mockGetPriceOnDate,
      );

      const processedTx = result.processedTransactions[0];

      // Should identify TX3 as the send transaction (negative amount, contains selected outpoint)
      expect(processedTx.tradeTx.sendTxHash).toBe(
        '00eb7fa499ad65061e93b2f9234290666438d131c5602c826496e2b4bbd74760',
      );
      expect(processedTx.tradeTx.receiveTxHash).toBe(
        'bca6a4da0cdc1609381f6643f1c4ade8fd6e6367a480ad1e44f9384a0ebc9364',
      );

      // Should include the send transaction in processed hashes
      expect(
        result.processedTxHashes.has(
          '00eb7fa499ad65061e93b2f9234290666438d131c5602c826496e2b4bbd74760',
        ),
      ).toBe(true);
    });

    it('should correctly handle MWEB change transactions', async () => {
      const result = await processConvertTransactions(
        [additionalConvertTxs[1]], // 0.04 LTC convert
        additionalTransactions,
        mockGetPriceOnDate,
      );

      const processedTx = result.processedTransactions[0];

      // Should include MWEB change transaction (TX5)
      expect(
        result.processedTxHashes.has(
          '1afccdcdd92a7097dd234140024b46d9655e0bf2ae0630600b032b51874fb851',
        ),
      ).toBe(true);

      // Should merge outputs from main receive (2) + MWEB change (1) + any additional related outputs
      expect(processedTx.outputDetails.length).toBeGreaterThanOrEqual(3);

      const mwebOutputs = processedTx.outputDetails.filter(
        output => output.outputType === 12,
      );
      expect(mwebOutputs.length).toBeGreaterThan(0);
      // Check that at least one MWEB output is present and has the expected characteristics
      const hasMwebOutput = mwebOutputs.some(
        output => output.address.startsWith('ltcmweb') && output.isOurAddress,
      );
      expect(hasMwebOutput).toBe(true);
    });

    it('should correctly handle small amount convert (0.005 LTC)', async () => {
      const result = await processConvertTransactions(
        [additionalConvertTxs[2]], // 0.005 LTC convert
        additionalTransactions,
        mockGetPriceOnDate,
      );

      const processedTx = result.processedTransactions[0];

      expect(processedTx.tradeTx.targetAmount).toBe(500000);
      expect(processedTx.tradeTx.destinationAddress).toBe(
        'ltc1qgdytp7lyhfl7tpg6cpm67zmgh6k28gv0a29t8e',
      );

      // Should find both the main transaction and MWEB change
      expect(
        result.processedTxHashes.has(
          '19936c98e5e858761d7cf048518d454522c23d4763ebfa413356a0133e647fb0',
        ),
      ).toBe(true); // Main
      expect(
        result.processedTxHashes.has(
          'e34cc74c9b254624565a2d4bf79bd6c67508c8714e32756b3e919c982a092f42',
        ),
      ).toBe(true); // MWEB change

      // Should have 3 outputs: external + destination + MWEB change
      expect(processedTx.outputDetails).toHaveLength(3);
    });

    it('should correctly calculate total fees including send transaction fees', async () => {
      const result = await processConvertTransactions(
        [additionalConvertTxs[0]], // 1 LTC convert (has send transaction with fees)
        additionalTransactions,
        mockGetPriceOnDate,
      );

      const processedTx = result.processedTransactions[0];

      // Should sum fees from all related transactions
      // TX1: 0, TX2: 0, TX3: 104450350 = 104450350 total
      expect(processedTx.tradeTx.totalFees).toBe(104450350);
    });

    it('should handle converts with different block heights', async () => {
      const result = await processConvertTransactions(
        additionalConvertTxs,
        additionalTransactions,
        mockGetPriceOnDate,
      );

      expect(result.processedTransactions).toHaveLength(3);

      // Each convert should be based on its main transaction's block
      const convert1LTC = result.processedTransactions.find(
        tx => tx.tradeTx.targetAmount === 100000000,
      );
      const convert004LTC = result.processedTransactions.find(
        tx => tx.tradeTx.targetAmount === 4000000,
      );
      const convert0005LTC = result.processedTransactions.find(
        tx => tx.tradeTx.targetAmount === 500000,
      );

      expect(convert1LTC!.blockHeight).toBe(2948379);
      expect(convert004LTC!.blockHeight).toBe(2948419);
      expect(convert0005LTC!.blockHeight).toBe(2948421);
    });

    it('should not double-process transactions when convert transactions share UTXOs', async () => {
      // Both convertTxs[0] and convertTxs[2] use the same MWEB address in their selectedUtxos
      const result = await processConvertTransactions(
        [additionalConvertTxs[0], additionalConvertTxs[2]], // 1 LTC and 0.005 LTC converts
        additionalTransactions,
        mockGetPriceOnDate,
      );

      // Should process both converts separately
      expect(result.processedTransactions).toHaveLength(2);

      // Should not have overlapping processed transaction hashes
      expect(result.processedTxHashes.size).toBe(5); // TX1,TX2,TX3 + TX6,TX7

      const convert1LTC = result.processedTransactions.find(
        tx => tx.tradeTx.targetAmount === 100000000,
      );
      const convert0005LTC = result.processedTransactions.find(
        tx => tx.tradeTx.targetAmount === 500000,
      );

      expect(convert1LTC).toBeDefined();
      expect(convert0005LTC).toBeDefined();
    });
  });
});
