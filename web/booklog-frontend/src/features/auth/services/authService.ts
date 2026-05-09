/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "../../shared/services/api";

const persistUserSession = (userData: any) => {
  localStorage.setItem(
    "user",
    JSON.stringify({
      userId: userData.userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      profileImage: userData.profileImage,
      createdAt: userData.createdAt,
      username: userData.username || "",
      location: userData.location || "",
      bio: userData.bio || "",
      readingGoals: userData.readingGoals || {},
      oauthProvider: userData.provider || null,
      roles: userData.roles || ["ROLE_USER"]
    })
  );

  if (userData.token) {
    localStorage.setItem("token", userData.token);
  }
};

const mapAuthError = (error: any, fallbackMessage: string) => {
  if (error.response) {
    return {
      success: false,
      message: error.response.data.message || fallbackMessage,
      type: "error"
    };
  }

  if (error.request) {
    return {
      success: false,
      message: "No response from server. Is the backend running at http://localhost:8080 ?",
      type: "error"
    };
  }

  return {
    success: false,
    message: `${fallbackMessage}: ${error.message}`,
    type: "error"
  };
};

export const handleLogin = async (e: any, email: string, password: string) => {
  e.preventDefault();

  if (!email || !password) {
    return { success: false, message: "Please enter email and password", type: "warning" };
  }

  try {
    const response = await api.post("/auth/login", {
      email,
      password
    });

    persistUserSession(response.data);
    return { success: true, message: "Login successful!", type: "success" };
  } catch (error) {
    return mapAuthError(error, "Login failed");
  }
};

export const handleRegister = async (e: any, formData: any) => {
  e.preventDefault();

  const { firstName, lastName, email, password, confirmPassword } = formData;

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return { success: false, message: "Please fill in all fields", type: "warning" };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match", type: "warning" };
  }

  try {
    const response = await api.post("/auth/register", {
      firstName,
      lastName,
      email,
      password
    });

    persistUserSession(response.data);
    return { success: true, message: "Registration successful!", type: "success" };
  } catch (error) {
    return mapAuthError(error, "Registration failed");
  }
};
