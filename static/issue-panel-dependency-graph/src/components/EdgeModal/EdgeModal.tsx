import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button';
import { EdgeData, NodeData } from 'reaflow';
import { invoke, requestJira } from '@forge/bridge';
import { useContext } from 'react';
import { ActionKind } from '../../context/Reducer';
import { Context } from '../../context/Context';
import { PopupSelect } from '@atlaskit/select';

export interface EdgeModalData {
  edge: EdgeData;
  node1: NodeData;
  node2: NodeData;
}

function EdgeModal({ closeModal, modalData }: { closeModal: any; modalData: EdgeModalData }) {
  const { edge, node1, node2 } = modalData;
  const { dispatch } = useContext(Context);

  const onDependecyChange = ({ label }: any) => {
    dispatch({ type: ActionKind.CHANGE_DEPENDECY_TYPE, payload: label });
  };

  return (
    <div>
      <Modal onClose={closeModal} width={'x-large'} height={400}>
        <ModalHeader>
          <ModalTitle>
            {node1.id} <span style={{ fontWeight: '100' }}>{edge.text}</span> {node2.id}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <PopupSelect
            options={[
              { label: 'is blocked by', value: 'adelaide' },
              { label: 'blocks', value: 'brisbane' },
              { label: 'is cloned by', value: 'canberra' },
              { label: 'clones', value: 'darwin' },
              { label: 'is duplicated by', value: 'hobart' },
              { label: 'duplicates', value: 'melbourne' },
              { label: 'is caused by', value: 'perth' },
              { label: 'causes', value: 'sydney' },
              { label: 'relates to', value: '' },
            ]}
            onChange={onDependecyChange}
            popperProps={{
              placement: 'bottom',
              modifiers: [
                {
                  name: 'preventOverflow',
                  enabled: true,
                  options: {
                    padding: 5,
                    rootBoundary: 'document',
                  },
                },
              ],
            }}
            target={({ ref }) => <Button ref={ref}>Change dependency type</Button>}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            appearance="danger"
            onClick={() => {
              invoke('deleteIssueLink', { linkId: edge.data.id });
              dispatch({ type: ActionKind.REMOVE_EDGE, payload: edge });
            }}
            style={{ marginRight: 'auto' }}
          >
            Delete
          </Button>
          <Button appearance="subtle" onClick={closeModal} autoFocus>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default EdgeModal;
