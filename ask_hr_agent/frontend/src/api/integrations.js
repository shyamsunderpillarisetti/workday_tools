// Mock implementation of integrations to replace Base44 SDK

export const UploadFile = async ({ file }) => {
  console.log('Mock UploadFile:', file.name);
  return {
    file_url: URL.createObjectURL(file),
    file_id: 'mock-file-' + Date.now()
  };
};

export const Core = {
  UploadFile,
};
