import axios from "axios";

export const handleRegister = async (e, formData) => {

  e.preventDefault();

  const { firstName, lastName, email, password, confirmPassword } = formData;

  // validation
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return { success: false, message: "Please fill in all fields", type: "warning" };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match", type: "warning" };
  }

  try {

    const response = await axios.post(
      "http://localhost:8080/api/auth/register",
      {
        firstName,
        lastName,
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
    return { success: true, message: "Registration successful!", type: "success" };

  } catch (error) {

    console.error("Registration error:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      return {
        success: false,
        message: error.response.data.message || "Registration failed: server returned an error",
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
        message: "Registration error: " + error.message,
        type: "error"
      };
    }
  }
};