export type JiraProject = {
  id: number | string;
  key: string;
  name: string;
  self: string;
  avatarUrls: {
    '16x16': string;
    '24x24': string;
    '32x32': string;
    '48x48': string;
  };
  isPrivate: boolean;
  projectTypeKey: string;
  simplified: boolean;
  style: string;
};
