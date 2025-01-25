import React, {createContext, useState} from 'react';

interface Props {
  children: React.ReactElement;
}

interface PopUpContextType {
  showPopUp: (Component: any) => void;
  hidePopUp: () => void;
  PopUp: any;
}

const PopUpContext = createContext<PopUpContextType>({
  showPopUp: () => {},
  hidePopUp: () => {},
  PopUp: <React.Fragment />,
});

const PopUpProvider: React.FC<Props> = props => {
  const [popUpComponentState, setPopUpComponentState] = useState(
    <React.Fragment />,
  );

  function showPopUp(Component: any) {
    setPopUpComponentState(Component);
  }

  function hidePopUp() {
    setPopUpComponentState(<React.Fragment />);
  }

  return (
    <PopUpContext.Provider
      value={{
        showPopUp: (Component: any) => showPopUp(Component),
        hidePopUp: hidePopUp,
        PopUp: popUpComponentState,
      }}
      {...props}
    />
  );
};

export {PopUpContext, PopUpProvider};
