import "../css/UserDashboard.css";

function UserDashboard() {

  const booksLater = [
    "https://images.unsplash.com/photo-1512820790803-83ca734da794",
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da",
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353"
  ];

  return (
    <div className="dashboard">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo">
          📚 <span>BookLog</span>
        </div>

        <nav>
          <button className="active">Dashboard</button>
          <button>My Books</button>
          <button>Profile</button>
        </nav>

        <button className="logout">Logout</button>

      </aside>


      {/* Main Content */}
      <main className="main">

        {/* Header */}
        <div className="header">
          <h1>Welcome Back, Alex!</h1>
          <p>Keep up your reading journey and reach your goals</p>
        </div>


        {/* Stats */}
        <div className="stats">

          <div className="card">
            <p>Total Books</p>
            <h2>24</h2>
          </div>

          <div className="card">
            <p>Books Completed</p>
            <h2>18</h2>
          </div>

          <div className="card">
            <p>Reading Goal</p>
            <h2>2</h2>
          </div>

          <div className="card">
            <p>Avg Rating</p>
            <h2>4.2</h2>
          </div>

        </div>


        {/* Books to read later */}
        <div className="section">

          <div className="section-header">
            <h2>Books to Read Later</h2>
            <span>More →</span>
          </div>

          <div className="book-row">

            {booksLater.map((img, i) => (
              <img key={i} src={img} alt="book"/>
            ))}

            <div className="add-book">+</div>

          </div>

        </div>


        {/* Currently Reading */}
        <div className="reading">

          <div className="reading-header">
            <h2>Currently Reading</h2>
            <button className="add-btn">+ Add Book</button>
          </div>

          <div className="reading-card">

            <div>
              <h3>Atomic Habits</h3>
              <p>James Clear</p>
            </div>

            <div className="progress">
              <div className="progress-bar"></div>
              <span>65%</span>
            </div>

          </div>

          <div className="reading-card">

            <div>
              <h3>Deep Work</h3>
              <p>Cal Newport</p>
            </div>

            <div className="progress">
              <div className="progress-bar small"></div>
              <span>40%</span>
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default UserDashboard;