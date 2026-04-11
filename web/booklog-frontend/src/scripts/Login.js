import axios from "axios";

export const handleLogin = async (e, email, password) => {

  e.preventDefault();

  if (!email || !password) {
    return { success: false, message: "Please enter email and password", type: "warning" };
  }

  try {

    const response = await axios.post(
      "http://localhost:8080/api/auth/login",
      {
        email,
        password
      }
    );

    // Store user data in localStorage
    const userData = response.data;
    localStorage.setItem("user", JSON.stringify({
      userId: userData.userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      profileImage: userData.profileImage,
      createdAt: userData.createdAt,
      oauthProvider: userData.provider || null,
      roles: userData.roles || ["ROLE_USER"]
    }));

    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }

    console.log(response.data);

    return { success: true, message: "Login successful!", type: "success" };

  } catch (error) {

    console.error("Login error:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      return {
        success: false,
        message: error.response.data.message || "Login failed: server returned an error",
        type: "error"
      };
    } else if (error.request) {
      console.error("No response received:", error.request);
      return {
        success: false,
        message: "No response from server. Is the backend running at http://localhost:8080 ?",
        type: "error"
      };
    } else {
      console.error("Error setting up request:", error.message);
      return {
        success: false,
        message: "Login error: " + error.message,
        type: "error"
      };
    }
  }
};