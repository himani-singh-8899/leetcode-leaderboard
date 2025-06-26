import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from "@mui/material";
import "./Leaderboard.css";

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
  const [darkMode, setDarkMode] = useState(false);

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
      const res = await fetch("https://leetcode-leaderboard-1.onrender.com/api/leetcode", {
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
        name, problemsSolved, easy, medium, hard, contestRating: rating,
      };

      const updated = [...data.filter((u) => u.name !== name), newUser].sort(
        (a, b) => b.problemsSolved - a.problemsSolved
      );

      const prevDaily = JSON.parse(localStorage.getItem(`daily-${today}-${roomId}`) || "[]");
      const dailyUser = prevDaily.find((u) => u.name === name);
      const dailyChange = dailyUser ? problemsSolved - dailyUser.initial : 0;
      const updatedDaily = [
        ...prevDaily.filter((u) => u.name !== name),
        { name, change: dailyChange, initial: dailyUser ? dailyUser.initial : problemsSolved },
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
    if (savedDaily) 
    setDailyData(JSON.parse(savedDaily));
  }, [roomId, today]);

  return (
    <div className={darkMode ? "bg-dark transition-all" : "bg-light transition-all"}>
      <div className="max-w-7xl mx-auto p-6 space-y-14">
      <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">LeetCode Leaderboard</h1>
        <div className="flex justify-end">
          <button className="button-primary" onClick={() => setDarkMode(!darkMode)}>
            Toggle {darkMode ? "Light" : "Dark"} Mode
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-colored animate-fadeInUp">
            <h2 className="text-2xl font-bold">Welcome to Jeet_ki_tyaari</h2>
            <p className="text-sm mt-2">Room ID: <span className="font-mono">{roomId}</span></p>
            <p className="text-sm mt-2">Track your LeetCode progress with friends </p>
          </div>
          <div className={`card-glass ${darkMode ? "card-dark" : ""}`}>
            <input
              type="text"
              placeholder="Enter LeetCode username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded border mb-4"
            />
            <button onClick={handleAddUser} className="button-primary w-full">
              Join Room
            </button>
            {loading && <p className="mt-2 text-sm">Loading...</p>}
          </div>
        </div>

        {data.length > 0 && (
          <div className="animate-fadeInUp">
            <h2 className="text-2xl font-bold text-center mb-6">Top 3 Performers</h2>
            <Swiper slidesPerView="auto" spaceBetween={20} grabCursor centeredSlides className="pb-10">
              <AnimatePresence>
                {data.slice(0, 3).map((user, index) => (
                  <SwiperSlide key={user.name} className="w-72 p-2 swiper-slide">
                    <motion.div whileHover={{ scale: 1.05 }} className="card-glass">
                      <div className="bg-white text-center">
                        <h3 className="text-xl font-bold">{user.name}</h3>
                        <p className="text-sm">
                          Rank: #{index + 1} {['🥇', '🥈', '🥉'][index]}
                        </p>
                      </div>
                      <div className="text-sm mt-3 space-y-1">
                        <div>Total Solved: <strong>{user.problemsSolved}</strong></div>
                        <div>Easy: {user.easy} | Medium: {user.medium} | Hard: {user.hard}</div>
                        <div>Rating: {user.contestRating}</div>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
              </AnimatePresence>
            </Swiper>
          </div>
        )}
        {data.length > 0 && (
          <div className="animate-fadeInUp">
            <h2 className="text-2xl font-bold text-center mb-6">Overall Leaderboard</h2>
            <TableContainer component={Paper} className="table-container">
              <Table>
                <TableHead>
                  <TableRow className={darkMode ? "table-head-dark" : "table-head"}>
                    <TableCell>Rank</TableCell><TableCell>Name</TableCell><TableCell>Total</TableCell>
                    <TableCell>Easy</TableCell><TableCell>Medium</TableCell>
                    <TableCell>Hard</TableCell><TableCell>Rating</TableCell><TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((user, index) => (
                    <TableRow key={user.name}>
                      <TableCell>{index + 1}</TableCell><TableCell>{user.name}</TableCell>
                      <TableCell>{user.problemsSolved}</TableCell><TableCell>{user.easy}</TableCell>
                      <TableCell>{user.medium}</TableCell><TableCell>{user.hard}</TableCell>
                      <TableCell>{user.contestRating}</TableCell>
                      <TableCell>
                        <button className="button-danger" onClick={() => handleDelete(user.name)}>
                          Delete
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}

        {dailyData.length > 0 && (
          <div className="animate-fadeInUp">
            <h2 className="text-2xl font-bold text-center mb-6">Today's Progress Leaderboard</h2>
            <TableContainer component={Paper} className="table-container">
              <Table>
                <TableHead>
                  <TableRow className={darkMode ? "table-head-dark" : "table-head"}>
                    <TableCell>Rank</TableCell><TableCell>Name</TableCell><TableCell>Problems Solved Today</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyData.map((user, index) => (
                    <TableRow key={user.name}>
                      <TableCell>{index + 1}</TableCell><TableCell>{user.name}</TableCell>
                      <TableCell>{user.change}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
