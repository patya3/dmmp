import { view } from '@forge/bridge';

const context = await view.getContext();
const customValue = context.modal.customKey;

view.close({
  formValues: [],
});
