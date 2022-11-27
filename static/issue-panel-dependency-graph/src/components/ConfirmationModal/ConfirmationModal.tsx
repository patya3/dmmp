import Button from '@atlaskit/button';
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTransition,
} from '@atlaskit/modal-dialog';
import { invoke } from '@forge/bridge';
import { useCallback, useContext } from 'react';
import { Context } from '../../context/Context';
import { ActionKind } from '../../context/Reducer';

export interface ConfirmationModalProps {
  title: string;
  body: React.ReactNode | string;
  buttons: string[];
  additionalData: Record<string, any>;
}

function ConfirmationModal({ title, body, buttons, additionalData }: ConfirmationModalProps) {
  const { state, dispatch } = useContext(Context);
  const { confirmationModalIsOpen } = state;
  const closeModal = useCallback(
    () => dispatch({ type: ActionKind.SET_MODAL_OPEN, payload: false }),
    [],
  );

  const onRemoveEdge = useCallback((edgeId: string) => {
    invoke('deleteIssueLink', { linkId: edgeId });
    dispatch({ type: ActionKind.REMOVE_LINK, payload: edgeId });
    dispatch({ type: ActionKind.SET_MODAL_OPEN, payload: false });
  }, []);

  return (
    <div>
      <ModalTransition>
        {confirmationModalIsOpen && (
          <Modal onClose={closeModal}>
            <ModalHeader>
              <ModalTitle>{title}</ModalTitle>
            </ModalHeader>
            <ModalBody>{body}</ModalBody>
            <ModalFooter>
              <Button appearance="subtle" onClick={closeModal}>
                Cancel
              </Button>
              {buttons.map((buttonType: string) => {
                if (buttonType === 'delete') {
                  return (
                    <Button
                      appearance="danger"
                      autoFocus
                      onClick={() => onRemoveEdge(additionalData.edgeId)}
                    >
                      Delete
                    </Button>
                  );
                }
              })}
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>
    </div>
  );
}

export default ConfirmationModal;
