import React, { useState, useEffect } from "react";

function Leaderboard() {
  const [roomId] = useState(() => {
    const saved = localStorage.getItem("leetcode-room-id");
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 10);
    localStorage.setItem("leetcode-room-id", newId);
    return newId;
  });

  const [username, setUsername] = useState("");
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(`room-${roomId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const handleAddUser = async () => {
    const name = username.trim();
    if (!name) return;

    setLoading(true);

    const query = {
      query: `
        query userSessionProgress($username: String!) {
          matchedUser(username: $username) {
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
          userContestRanking(username: $username) {
            rating
          }
        }
      `,
      variables: { username: name },
    };

    try {
      const res = await fetch("https://your-backend-host.com/api/leetcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });

      const json = await res.json();
      const user = json.data.matchedUser;
      const rating = json.data.userContestRanking?.rating || "N/A";
      const acStats = user?.submitStats?.acSubmissionNum || [];

      const getCount = (difficulty) =>
        acStats.find((x) => x.difficulty === difficulty)?.count || 0;

      const problemsSolved = getCount("All");
      const easy = getCount("Easy");
      const medium = getCount("Medium");
      const hard = getCount("Hard");

      const newUser = {
        name,
        problemsSolved,
        easy,
        medium,
        hard,
        contestRating: rating,
      };

      const updated = [...data.filter(u => u.name !== name), newUser].sort(
        (a, b) => b.problemsSolved - a.problemsSolved
      );

      const prevDaily = JSON.parse(localStorage.getItem(`daily-${today}-${roomId}`) || "[]");
      const dailyUser = prevDaily.find((u) => u.name === name);
      const dailyChange = dailyUser ? problemsSolved - dailyUser.initial : 0;
      const updatedDaily = [
        ...prevDaily.filter((u) => u.name !== name),
        { name, change: dailyChange, initial: problemsSolved },
      ];

      setData(updated);
      setDailyData(updatedDaily.sort((a, b) => b.change - a.change));
      localStorage.setItem(`room-${roomId}`, JSON.stringify(updated));
      localStorage.setItem(`daily-${today}-${roomId}`, JSON.stringify(updatedDaily));
      setUsername("");
    } catch (error) {
      console.error("Error fetching user:", error);
    }

    setLoading(false);
  };

  const handleDelete = (nameToDelete) => {
    const updated = data.filter((user) => user.name !== nameToDelete);
    const updatedDaily = dailyData.filter((user) => user.name !== nameToDelete);
    setData(updated);
    setDailyData(updatedDaily);
    localStorage.setItem(`room-${roomId}`, JSON.stringify(updated));
    localStorage.setItem(`daily-${today}-${roomId}`, JSON.stringify(updatedDaily));
  };

  useEffect(() => {
    const savedDaily = localStorage.getItem(`daily-${today}-${roomId}`);
    if (savedDaily) {
      setDailyData(JSON.parse(savedDaily));
    }
  }, [roomId, today]);

  return (
    <div className="bg-white min-h-screen text-black px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Jeet_ki_tyaari - Room ID: {roomId}</h1>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter your LeetCode username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-300 bg-white text-black p-2 rounded w-full"
          />
          <button
            onClick={handleAddUser}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Join Room
          </button>
        </div>

        {loading && <p className="text-center text-lg">Loading...</p>}

        {data.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-8 mb-2">Overall Leaderboard</h2>
            <table className="w-full text-left text-sm mt-2 mb-8">
              <thead className="text-gray-600 border-b border-gray-300">
                <tr>
                  <th className="py-2">Rank</th>
                  <th>Name</th>
                  <th>Total</th>
                  <th className="text-green-600">Easy</th>
                  <th className="text-yellow-600">Medium</th>
                  <th className="text-red-600">Hard</th>
                  <th>Rating</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((user, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3">{index + 1}</td>
                    <td className="font-medium text-blue-600">{user.name}</td>
                    <td>{user.problemsSolved}</td>
                    <td className="text-green-600">{user.easy}</td>
                    <td className="text-yellow-600">{user.medium}</td>
                    <td className="text-red-600">{user.hard}</td>
                    <td>{user.contestRating}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(user.name)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {dailyData.length > 0 && (
              <>
                <h2 className="text-xl font-semibold mt-8 mb-2">Today's Progress Leaderboard</h2>
                <table className="w-full text-left text-sm mt-2">
                  <thead className="text-gray-600 border-b border-gray-300">
                    <tr>
                      <th className="py-2">Rank</th>
                      <th>Name</th>
                      <th>Problems Solved Today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map((user, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-3">{index + 1}</td>
                        <td className="font-medium text-blue-600">{user.name}</td>
                        <td>{user.change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
