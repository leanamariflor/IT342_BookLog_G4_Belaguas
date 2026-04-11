import api from "./api";

export const registerUser = (data: any) => {
  return api.post("/auth/register", data);
};

export const loginUser = (data: any) => {
  return api.post("/auth/login", data);
};