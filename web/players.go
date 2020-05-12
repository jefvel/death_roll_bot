
package main

import (
  "fmt"
  "net/http"
  "encoding/json"

  "github.com/julienschmidt/httprouter"
  "database/sql"

  _ "github.com/lib/pq"
)

type Item struct {
  Name string `json:"name"`
  Description string `json:"description"`
  OwnerID string `json:"ownerID"`
  AvatarURL string `json:"avatarURL"`
  Emoji string `json:"emoji"`
  Price int `json:"price"`
}

type Player struct {
  Id string `json:"id"`
  UserName string `json:"username"`
  Title *string `json:"title"`
  Currency int `json:"currency"`
  ChickenCount int `json:"chickenCount"`
  Wins int `json:"wins"`
  Losses int `json:"losses"`
  WinStreak int `json:"winStreak"`
  LoseStreak int `json:"loseStreak"`
  TownID *string `json:"townID"`
  Town *Town `json:"town"`
  Items []Item `json:"items"`
}

type PlayerList struct {
	Players []Player `json:"players"`
}

func getPlayerItems(id string) []Item {
  sqlStatement := `SELECT name, description, avatar_url, emoji, price from items where id in (select "itemId" from player_items where "playerId"=$1)`;

  rows, err := db.Query(sqlStatement, id)
  if err != nil {
    fmt.Println(err)
	return nil
  }

  var items []Item

  for rows.Next() {
	t := Item{}
    switch err := rows.Scan(&t.Name, &t.Description, &t.AvatarURL, &t.Emoji, &t.Price); err {
	case sql.ErrNoRows:
      return nil
	case nil:
	  items = append(items, t)
	default:
      fmt.Println(err)
	}
  }

  return items
}

func PlayerInfo(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  id := ps.ByName("id")

  sqlStatement := `SELECT id, username, currency, wins, losses, "chickenCount", title, "townId", win_streak, lose_streak  FROM players WHERE id=$1;`
  t := Player{}

  row := db.QueryRow(sqlStatement, id)

  switch err := row.Scan(&t.Id, &t.UserName, &t.Currency, &t.Wins, &t.Losses, &t.ChickenCount, &t.Title, &t.TownID, &t.WinStreak, &t.LoseStreak); err {
  case sql.ErrNoRows:
	fmt.Fprintf(w, "null")
  case nil:
    t.Items = getPlayerItems(id)
    if t.TownID != nil {
      town, _ := getTown(*t.TownID)
      t.Town = town
    }
    s, _ := json.Marshal(t)
    w.Write(s)
  default:
    fmt.Println(err)
  }
}

func ListPlayers(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  sqlStatement := `SELECT id, username, currency, wins, losses, "chickenCount", title, "townId", win_streak, lose_streak FROM players;`
  players := PlayerList{}

  rows, err := db.Query(sqlStatement)
  if err != nil {
    fmt.Println(err)
	return
  }

  for rows.Next() {
	t := Player{}
    switch err := rows.Scan(&t.Id, &t.UserName, &t.Currency, &t.Wins, &t.Losses, &t.ChickenCount, &t.Title, &t.TownID, &t.WinStreak, &t.LoseStreak); err {
	case sql.ErrNoRows:
	  fmt.Fprintf(w, "null")
	case nil:
	  players.Players = append(players.Players, t)
	default:
	  panic(err)
	}
  }

  s, _ := json.Marshal(players)
  w.Write(s)
}

func Top10Players(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
  sqlStatement := `SELECT id, username, currency, wins, losses, "chickenCount", title, "townId", win_streak, lose_streak FROM players ORDER BY currency DESC LIMIT 10;`
  players := PlayerList{}

  rows, err := db.Query(sqlStatement)
  if err != nil {
    fmt.Println(err)
	return
  }

  for rows.Next() {
	t := Player{}
    switch err := rows.Scan(&t.Id, &t.UserName, &t.Currency, &t.Wins, &t.Losses, &t.ChickenCount, &t.Title, &t.TownID, &t.WinStreak, &t.LoseStreak); err {
	case sql.ErrNoRows:
	  fmt.Fprintf(w, "null")
	case nil:
	  players.Players = append(players.Players, t)
	default:
	  panic(err)
	}
  }

  s, _ := json.Marshal(players)
  w.Write(s)
}

