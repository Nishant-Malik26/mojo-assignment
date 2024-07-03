import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [pages, setPages] = useState([]);
  const [pageStats, setPageStats] = useState(null);
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken") || ""
  );

  useEffect(() => {
    if (accessToken) {
      fetchUserPages(accessToken);
    }
  }, [accessToken]);

  const handleFBLogin = () => {
    if (window.FB) {
      window.FB.login(
        function (response) {
          if (response.authResponse) {
            const token = response.authResponse.accessToken;
            setAccessToken(token);
            localStorage.setItem("accessToken", token);
            window.FB.api(
              "/me",
              { fields: "name, picture", access_token: token },
              function (response) {
                setUser(response);
                localStorage.setItem("user", JSON.stringify(response));
                fetchUserPages(token);
              }
            );
          } else {
            alert("Not logged in. Please give all permissons needed");
          }
        },
        {
          scope:
            "pages_show_list, pages_read_engagement, pages_read_user_content",
        }
      );
    } else {
      alert("internal server error");
    }
  };

  const fetchUserPages = (token) => {
    window.FB.api("/me/accounts", { access_token: token }, function (response) {
      if (response && !response.error) {
        setPages(response.data);
      } else {
        console.error(response.error);
      }
    });
  };

  const handlePageSelect = (event) => {
    const pageId = event.target.value;
    const selectedPage = pages.find((page) => page.id === pageId);
    if (selectedPage) {
      const pageAccessToken = selectedPage.access_token;
      fetchPageStats(pageId, pageAccessToken);
    }
  };

  const fetchPageStats = (pageId, pageAccessToken) => {
    const metrics = [
      "page_follows",
      "page_consumptions_unique",
      "page_impressions",
      "page_actions_post_reactions_like_total",
    ];
    const params = `since=${since}&until=${until}&period=total_over_range&access_token=${pageAccessToken}`;
    window.FB.api(
      `/${pageId}/insights?metric=${metrics.join(",")}&${params}`,
      function (response) {
        console.log("🚀 ~ fetchPageStats ~ response:", response);

        if (response.length > 0 && !response.error) {
          const stats = response.data.reduce((acc, item) => {
            acc[item.name] = item.values[0]?.value || 0;
            return acc;
          }, {});
          setPageStats(stats);
        } else {
          alert("No data found for searched date range");
          console.error(response.error);
        }
      }
    );
  };
  console.log(user, "user");
  console.log(pages, "pages");
  console.log(accessToken, "accessToken");

  return (
    <div className="App">
      <div id="fb-root"></div>
      <h1>MOJO Facebook App</h1>
      {!user ? (
        <>
          <h5>Please Login using the button below</h5>
          <button className="loginButton" onClick={handleFBLogin}>
            Login with Facebook
          </button>
        </>
      ) : (
        <div>
          <div className="profileContainer">
            <h2>Welcome, {user.name}</h2>
            <div className="imageContainer">
              <img src={user.picture.data.url} alt={user.name} />
            </div>
            <div>
              <label>
                Since:
                <input
                  type="date"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                />
              </label>
              <label>
                Until:
                <input
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>Select Page:</label>
              <select onChange={handlePageSelect}>
                <option value="">Select a page</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pageStats && (
            <div className="cards">
              <div className="card">
                <h3>Total Followers / Fans</h3>
                <p>{pageStats?.page_follows}</p>
              </div>
              <div className="card">
                <h3>Total Engagement</h3>
                <p>{pageStats?.page_consumptions_unique}</p>
              </div>
              <div className="card">
                <h3>Total Impressions</h3>
                <p>{pageStats?.page_impressions}</p>
              </div>
              <div className="card">
                <h3>Total Reactions</h3>
                <p>{pageStats?.page_actions_post_reactions_like_total}</p>
              </div>
            </div>
          )}
        </div>
      )}
      {accessToken && (
        <button
          className="logoutButton"
          onClick={() => {
            localStorage.clear();
            setUser(null);
            setAccessToken(null);
          }}
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default App;
