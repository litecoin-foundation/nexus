import React, {createContext, useState, useCallback} from 'react';

interface Props {
  children: React.ReactElement;
}

interface PopUpContextType {
  showPopUp: (Component: any, id?: string) => void;
  PopUps: {component: React.JSX.Element; id: string}[];
}

const PopUpContext = createContext<PopUpContextType>({
  showPopUp: () => {},
  PopUps: [
    {
      component: <React.Fragment />,
      id: 'shared-context',
    },
  ],
});

const PopUpProvider: React.FC<Props> = props => {
  const [popUps, setPopUps] = useState([
    {
      component: <React.Fragment />,
      id: 'shared-context',
    },
  ]);

  const showPopUp = useCallback(
    (Component: any, id: string = 'shared-context') => {
      setPopUps(prevPopUps => {
        const existingIndex = prevPopUps.findIndex(popup => popup.id === id);

        if (existingIndex !== -1) {
          // Update existing popUp
          const updatedPopUps = [...prevPopUps];
          updatedPopUps[existingIndex] = {component: Component, id};
          return updatedPopUps;
        } else {
          // Add new popUp
          return [...prevPopUps, {component: Component, id}];
        }
      });
    },
    [],
  );

  return (
    <PopUpContext.Provider
      value={{
        showPopUp,
        PopUps: popUps,
      }}
      {...props}
    />
  );
};

export {PopUpContext, PopUpProvider};
