import axios from "axios";

const API = "https://nancearizer.up.railway.app";

export const getSummary = async (space: string, id: string, type: "proposal" | "thread") => {
  const res = await axios.get(`${API}/${type}/${space}/${id}`);
  return res.data;
};
