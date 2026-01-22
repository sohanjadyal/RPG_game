import { useState, useEffect } from "react";
import StartScreen from "./components/StartScreen";
import GameUI from "./components/GameUI";
import EndingScreen from "./components/EndingScreen";
import { enemies } from "./data/enemies";
import { weapons } from "./data/weapons";

/* ================= SAVE HELPERS ================= */
const SAVE_KEY = "dragon-repeller-save";

function loadGame() {
  const data = localStorage.getItem(SAVE_KEY);
  return data ? JSON.parse(data) : null;
}

function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export default function App() {
  const saved = loadGame();

  /* ================= CORE STATE ================= */
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(saved?.ended ?? false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [win, setWin] = useState(false);


  const [xp, setXp] = useState(saved?.xp ?? 0);
  const [health, setHealth] = useState(saved?.health ?? 100);
  const [gold, setGold] = useState(saved?.gold ?? 50);

  const [currentWeapon, setCurrentWeapon] = useState(
    saved?.currentWeapon ?? 0
  );
  const [inventory, setInventory] = useState(
    saved?.inventory ?? ["stick"]
  );

  const [location, setLocation] = useState(
    saved?.location ?? "town"
  );

  const [enemy, setEnemy] = useState(null);
  const [enemyHealth, setEnemyHealth] = useState(0);

  const [randomNumbers, setRandomNumbers] = useState([]);

  const isDragonDefeated = enemy?.name === "dragon";

  /* ================= AUTO SAVE ================= */
  useEffect(() => {
    saveGame({
      xp,
      health,
      gold,
      currentWeapon,
      inventory,
      location,
      ended
    });
  }, [xp, health, gold, currentWeapon, inventory, location, ended]);

  /* ================= START / END ================= */
  if (!started) {
    return <StartScreen onStart={() => setStarted(true)} />;
  }

  if (ended) {
    return <EndingScreen win={win} />;
  }

  /* ================= NAVIGATION ================= */
  function goTown() {
    setEnemy(null);
    setLocation("town");
  }

  /* ================= STORE ================= */
  function buyHealth() {
    if (gold >= 10) {
      setGold(g => g - 10);
      setHealth(h => h + 10);
    }
  }

  function buyWeapon() {
    if (currentWeapon < weapons.length - 1 && gold >= 30) {
      const next = currentWeapon + 1;
      setGold(g => g - 30);
      setCurrentWeapon(next);
      setInventory(inv => [...inv, weapons[next].name]);
    }
  }

  function sellWeapon() {
    if (inventory.length > 1) {
      setGold(g => g + 15);
      setInventory(inv => inv.slice(0, -1));
      setCurrentWeapon(w => Math.max(0, w - 1));
    }
  }

  /* ================= EASTER EGG ================= */
  function easterEgg() {
    setLocation("easter");
  }

  function pickNumber(guess) {
    const nums = Array.from({ length: 10 }, () =>
      Math.floor(Math.random() * 11)
    );

    setRandomNumbers(nums);

    if (nums.includes(guess)) {
      setGold(g => g + 20);
    } else {
      setHealth(h => {
        const next = h - 10;
        if (next <= 0) setEnded(true);
        return next;
      });
    }
  }

  /* ================= COMBAT ================= */
  function startFight(index) {
    const m = enemies[index];
    setEnemy(m);
    setEnemyHealth(m.health);
    setLocation("fight");
  }

  function attack() {
  if (!enemy) return;

  // 🔥 trigger animation
  setIsAttacking(true);
  setTimeout(() => setIsAttacking(false), 300);

  const weapon = weapons[currentWeapon];

  const playerDamage =
    weapon.power + Math.floor(Math.random() * xp) + 1;

  const monsterDamage =
    Math.floor(Math.random() * enemy.level * 5);

  setEnemyHealth(h => h - playerDamage);
  setHealth(h => h - monsterDamage);

  // weapon break chance
  if (Math.random() <= 0.1 && inventory.length > 1) {
    setInventory(inv => inv.slice(0, -1));
    setCurrentWeapon(w => w - 1);
  }

  if (enemyHealth - playerDamage <= 0) {
    setXp(x => x + enemy.level);
    setGold(g => g + Math.floor(enemy.level * 6.7));

    if (Math.random() <= 0.1) {
      setEnemy(null);
      easterEgg();
      return;
    }

    if (enemy.name === "dragon") {
      setWin(true);
      setEnded(true);
    } else {
      goTown();
    }
  }

  if (health - monsterDamage <= 0) {
    setWin(false);
    setEnded(true);
  }
}


  /* ================= UI ================= */
  return (
    <GameUI
      xp={xp}
      health={health}
      gold={gold}
      location={location}
      enemy={enemy}
      enemyHealth={enemyHealth}
      inventory={inventory}
      weapon={weapons[currentWeapon]}
      isAttacking={isAttacking} 
      randomNumbers={randomNumbers}
      actions={{
        setLocation,
        goTown,
        buyHealth,
        buyWeapon,
        sellWeapon,
        startFight,
        attack,
        pickNumber
      }}
    />
  );
}
