import axios from "axios";

export const handleLogin = async (e, email, password) => {

  e.preventDefault();

  if (!email || !password) {
    alert("Please enter email and password");
    return false;
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
      oauthProvider: userData.provider || null,
      roles: userData.roles || ["ROLE_USER"]
    }));

    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }

    alert("Login successful!");

    console.log(response.data);

    return true;

  } catch (error) {

    console.error("Login error:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      alert(error.response.data.message || "Login failed: server returned an error");
    } else if (error.request) {
      console.error("No response received:", error.request);
      alert("No response from server. Is the backend running at http://localhost:8080 ?");
    } else {
      console.error("Error setting up request:", error.message);
      alert("Login error: " + error.message);
    }

    return false;
  }
};