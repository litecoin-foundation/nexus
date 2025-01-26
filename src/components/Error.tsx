import React from 'react';
import InfoModal from './Modals/InfoModalContent';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {hideError} from '../reducers/errors';

interface Props {}

const Error: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const {visible, message} = useAppSelector(state => state.errors);

  return (
    <InfoModal
      isVisible={visible}
      text={message}
      textColor="red"
      close={() => dispatch(hideError())}
    />
  );
};

export default Error;
