const express = require('express')
const app = express()
app.use(express.json())

const cors = require('cors')
app.use(cors())

const path = require('path')
const { open } = require('sqlite')
const sqlite3 = require('sqlite3')

let db = null
const dbPath = path.join(__dirname, 'db', 'cricketMatchDetails.db')

const init = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    const port = process.env.PORT || 3000
    app.listen(port, () => {
      console.log(`Server started at port ${port}...`)
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

// API 1 - Get all players
app.get('/players/', async (req, res) => {
  const query = `
    SELECT 
      player_id AS playerId, 
      player_name AS playerName 
    FROM player_details;
  `
  const players = await db.all(query)
  res.send(players)
})

// API 2 - Get player by ID
app.get('/players/:playerId/', async (req, res) => {
  const { playerId } = req.params
  const query = `
    SELECT 
      player_id AS playerId, 
      player_name AS playerName 
    FROM player_details 
    WHERE player_id = ?;
  `
  const player = await db.get(query, [playerId])
  res.send(player)
})

// API 3 - Update player name
app.put('/players/:playerId/', async (req, res) => {
  const { playerId } = req.params
  const { playerName } = req.body
  const query = `
    UPDATE player_details 
    SET player_name = ? 
    WHERE player_id = ?;
  `
  await db.run(query, [playerName, playerId])
  res.send('Player Details Updated')
})

// API 4 - Get match by ID
app.get('/matches/:matchId/', async (req, res) => {
  const { matchId } = req.params
  const query = `
    SELECT 
      match_id AS matchId, 
      match, 
      year 
    FROM match_details 
    WHERE match_id = ?;
  `
  const match = await db.get(query, [matchId])
  res.send(match)
})

// API 5 - Get matches played by a player
app.get('/players/:playerId/matches', async (req, res) => {
  const { playerId } = req.params
  const query = `
    SELECT 
      md.match_id AS matchId, 
      md.match, 
      md.year 
    FROM player_match_score AS pms
    JOIN match_details AS md ON pms.match_id = md.match_id
    WHERE pms.player_id = ?;
  `
  const matches = await db.all(query, [playerId])
  res.send(matches)
})

// API 6 - Get players in a match
app.get('/matches/:matchId/players', async (req, res) => {
  const { matchId } = req.params
  const query = `
    SELECT 
      pd.player_id AS playerId, 
      pd.player_name AS playerName 
    FROM player_match_score AS pms
    JOIN player_details AS pd ON pms.player_id = pd.player_id
    WHERE pms.match_id = ?;
  `
  const players = await db.all(query, [matchId])
  res.send(players)
})

// API 7 - Get player total stats
app.get('/players/:playerId/playerScores', async (req, res) => {
  const { playerId } = req.params
  const query = `
    SELECT 
      pd.player_id AS playerId, 
      pd.player_name AS playerName, 
      SUM(pms.score) AS totalScore,
      SUM(pms.fours) AS totalFours,
      SUM(pms.sixes) AS totalSixes
    FROM player_details AS pd
    JOIN player_match_score AS pms ON pd.player_id = pms.player_id
    WHERE pd.player_id = ?
    GROUP BY pd.player_id;
  `
  const stats = await db.get(query, [playerId])
  res.send(stats)
})

init()
module.exports = app
 
