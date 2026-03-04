import axios from "axios";

export const handleRegister = async (e, formData) => {

  e.preventDefault();

  const { firstName, lastName, email, password, confirmPassword } = formData;

  // validation
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    alert("Please fill in all fields");
    return false;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return false;
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

    alert("Registration successful!");

    console.log(response.data);
    return true;

  } catch (error) {

    console.error("Registration error:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      alert(error.response.data.message || "Registration failed: server returned an error");
    } else if (error.request) {
      console.error("No response received:", error.request);
      alert("No response from server. Is the backend running at http://localhost:8080 ?");
    } else {
      console.error("Error setting up request:", error.message);
      alert("Registration error: " + error.message);
    }

    return false;

  }
};