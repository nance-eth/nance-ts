import axios from 'axios';

const API = 'https://juicebox.money/api/juicebox';

interface ProjectHandleResponse {
  projectId: string;
  handle: string;
}

export const getProjectHandle = async (projectId: string) => {
  try {
    const { data } = await axios.get<ProjectHandleResponse>(`${API}/projectHandle/${projectId}`);
    return (data.handle !== '') ? data.handle : undefined;
  } catch (e) {
    return undefined;
  }
};
