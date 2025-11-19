import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { Settings } from 'lucide-react';
import MapBuilder from '../components/mapbuilder';

export default function ArenaBattle() {
 const containerRef = useRef(null);
 const [gameStarted, setGameStarted] = useState(false);
 const [selectedSkin, setSelectedSkin] = useState('warrior');
 const [selectedArena, setSelectedArena] = useState('classic');
 const [teleportMode, setTeleportMode] = useState(false);
 const [showSettings, setShowSettings] = useState(false);
 const [showMapBuilder, setShowMapBuilder] = useState(false);
 const [customMaps, setCustomMaps] = useState(() => {
 const saved = localStorage.getItem('customArenas');
 return saved ? JSON.parse(saved) : {};
 });
 const [hotkeys, setHotkeys] = useState(() => {
 const saved = localStorage.getItem('arenaHotkeys');
 return saved ? JSON.parse(saved) : {
 moveForward: 'w',
 moveBackward: 's',
 moveLeft: 'a',
 moveRight: 'd',
 sprint: 'r',
 jump: ' ',
 laser: 'q',
 shield: 'e',
 skinSpecial: 'f',
 pause: 'p',
 };
 });
 const [editingKey, setEditingKey] = useState(null);
 const [gameState, setGameState] = useState({
   score: 0,
   highScore: parseInt(localStorage.getItem('arenaGameHighScore') || '0'),
   wave: 1,
   enemyCount: 0,
   health: 100,
   paused: false,
 });
 const [sniperMode, setSniperMode] = useState(false);

 const gameRef = useRef({
 scene: null,
 camera: null,
 renderer: null,
 controls: null,
 player: {
 position: new THREE.Vector3(0, 1.7, 0),
 velocity: new THREE.Vector3(),
 health: 100,
 skin: 'warrior',
 isJumping: false,
 verticalVelocity: 0,
 },
 enemies: [],
 bullets: [],
 abilities: {
 laser: { cooldown: 8000, lastUsed: 0 },
 shield: { cooldown: 12000, lastUsed: 0, active: false },
 skinSpecial: { cooldown: 5000, lastUsed: 0 },
 },
 keys: {},
 mouse: { x: 0, y: 0 },
 score: 0,
 wave: 1,
 running: false,
 initialized: false,
 shieldMesh: null,
 waveSpawning: false,
 });

 const skins = {
 warrior: { icon: '🛡', color: 0x4169e1, special: 'slowness_aura' },
 ninja: { icon: '🥷', color: 0x2c2c54, special: 'ninja_stars' },
 robot: { icon: '🤖', color: 0x708090, special: 'emp_blast' },
 mage: { icon: '🧙', color: 0x8a2be2, special: 'teleport' },
 alien: { icon: '👽', color: 0x00ff7f, special: 'acid_pool' },
 };

 const allArenas = {
 classic: { 
 name: 'Classic Arena', 
 obstacles: [
 { x: 15, z: 15, width: 4, depth: 8 },
 { x: -15, z: 15, width: 4, depth: 8 },
 { x: 15, z: -15, width: 4, depth: 8 },
 { x: -15, z: -15, width: 4, depth: 8 },
 { x: 25, z: 0, width: 4, depth: 12 },
 { x: -25, z: 0, width: 4, depth: 12 },
 { x: 0, z: 25, width: 12, depth: 4 },
 { x: 0, z: -25, width: 12, depth: 4 },
 ]
 },
 fortress: {
 name: 'Fortress',
 obstacles: [
 { x: 10, z: 10, width: 6, depth: 20 },
 { x: 30, z: 5, width: 20, depth: 6 },
 { x: -15, z: -15, width: 8, depth: 15 },
 { x: -30, z: 10, width: 6, depth: 18 },
 { x: 20, z: -20, width: 10, depth: 10 },
 { x: -10, z: 25, width: 8, depth: 8 },
 { x: 15, z: 30, width: 15, depth: 6 },
 { x: -25, z: -25, width: 10, depth: 10 },
 { x: 35, z: -10, width: 6, depth: 15 },
 { x: 5, z: -30, width: 12, depth: 6 },
 { x: -35, z: -5, width: 6, depth: 12 },
 { x: 25, z: 20, width: 8, depth: 8 },
 ],
 },
 maze: {
 name: 'Maze',
 obstacles: [
 { x: 8, z: 8, width: 4, depth: 20 },
 { x: 20, z: 8, width: 20, depth: 4 },
 { x: -10, z: -10, width: 4, depth: 15 },
 { x: 15, z: -15, width: 15, depth: 4 },
 { x: -20, z: 15, width: 4, depth: 25 },
 { x: 30, z: -5, width: 4, depth: 20 },
 { x: 0, z: 20, width: 18, depth: 4 },
 { x: 0, z: -25, width: 20, depth: 4 },
 { x: -30, z: -20, width: 15, depth: 4 },
 { x: 25, z: 25, width: 12, depth: 4 },
 { x: -15, z: 5, width: 4, depth: 18 },
 { x: 10, z: -30, width: 8, depth: 4 },
 { x: -25, z: 30, width: 10, depth: 4 },
 { x: 35, z: 15, width: 4, depth: 16 },
 ],
 },
 factory: {
 name: 'Factory',
 obstacles: [
 { x: 15, z: 10, width: 8, depth: 8 },
 { x: -12, z: -8, width: 6, depth: 10 },
 { x: 25, z: -15, width: 10, depth: 10 },
 { x: -25, z: 15, width: 8, depth: 12 },
 { x: 0, z: 20, width: 12, depth: 6 },
 { x: 0, z: -20, width: 14, depth: 6 },
 { x: 30, z: 25, width: 8, depth: 8 },
 { x: -30, z: -25, width: 10, depth: 10 },
 { x: 18, z: 30, width: 6, depth: 8 },
 { x: -20, z: 0, width: 6, depth: 16 },
 { x: 35, z: 0, width: 4, depth: 20 },
 { x: -35, z: 10, width: 4, depth: 15 },
 ],
 },
 ...customMaps,
 };

 const arenas = allArenas;

 const saveHotkeys = (newHotkeys) => {
 setHotkeys(newHotkeys);
 localStorage.setItem('arenaHotkeys', JSON.stringify(newHotkeys));
 };

 const handleKeyChange = (action, e) => {
 const key = e.key.toLowerCase();
 if (key.length === 1 || ['enter', 'escape', ' '].includes(key)) { // Added space for jump key
 const newHotkeys = { ...hotkeys, [action]: key };
 saveHotkeys(newHotkeys);
 setEditingKey(null);
 }
 };

 useEffect(() => {
 if (!gameStarted || !containerRef.current) return;

 const game = gameRef.current;
 const container = containerRef.current;

 game.scene = new THREE.Scene();
 game.scene.background = new THREE.Color(0x3a4f5f);
 game.scene.fog = new THREE.Fog(0x3a4f5f, 0, 120);

 game.camera = new THREE.PerspectiveCamera(
   75,
   container.clientWidth / container.clientHeight,
   0.1,
   1000
 );
 game.camera.position.copy(game.player.position);
 game.camera.defaultFov = 75;

 game.renderer = new THREE.WebGLRenderer({ antialias: true });
 game.renderer.setSize(container.clientWidth, container.clientHeight);
 game.renderer.shadowMap.enabled = true;
 game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
 container.appendChild(game.renderer.domElement);

 game.controls = new PointerLockControls(game.camera, game.renderer.domElement);

 const handleClick = () => {
 if (game.running && game.initialized) {
 game.controls.lock();
 }
 };
 container.addEventListener('click', handleClick);

 const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
 game.scene.add(ambientLight);

 const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
 directionalLight.position.set(50, 100, 50);
 directionalLight.castShadow = true;
 directionalLight.shadow.mapSize.width = 2048;
 directionalLight.shadow.mapSize.height = 2048;
 game.scene.add(directionalLight);

 const pointLight1 = new THREE.PointLight(0xffd700, 1, 50);
 pointLight1.position.set(20, 10, 20);
 game.scene.add(pointLight1);

 const pointLight2 = new THREE.PointLight(0xff4500, 1, 50);
 pointLight2.position.set(-20, 10, -20);
 game.scene.add(pointLight2);

 createArena(game, selectedArena);

 game.running = true;
 game.initialized = true;
 game.score = 0;
 game.wave = 1;
 game.player.health = 100;
 game.player.skin = selectedSkin;
 game.player.isJumping = false;
 game.player.verticalVelocity = 0;
 game.enemies = [];
 game.bullets = [];

 // Find a safe spawn position
 const findSafeSpawn = () => {
 const testPositions = [
 new THREE.Vector3(0, 1.7, 0),
 new THREE.Vector3(5, 1.7, 5),
 new THREE.Vector3(-5, 1.7, -5),
 new THREE.Vector3(5, 1.7, -5),
 new THREE.Vector3(-5, 1.7, 5),
 new THREE.Vector3(10, 1.7, 0),
 new THREE.Vector3(-10, 1.7, 0),
 new THREE.Vector3(0, 1.7, 10),
 new THREE.Vector3(0, 1.7, -10),
 ];

 for (const pos of testPositions) {
 let isSafe = true;
 game.obstacles?.forEach(obstacle => {
 const box = new THREE.Box3().setFromObject(obstacle);
 const playerBox = new THREE.Box3().setFromCenterAndSize(
 pos,
 new THREE.Vector3(1, 2, 1)
 );
 if (box.intersectsBox(playerBox)) {
 isSafe = false;
 }
 });
 if (isSafe) return pos;
 }
 return new THREE.Vector3(0, 1.7, 0);
 };

 const safeSpawn = findSafeSpawn();
 game.player.position.copy(safeSpawn);
 game.camera.position.copy(safeSpawn);

 setTimeout(() => spawnWave(game), 1000);

 let lastTime = performance.now();
 const animate = () => {
   if (!game.running) return;

   const currentTime = performance.now();
   const delta = (currentTime - lastTime) / 1000;
   lastTime = currentTime;

   if (!gameState.paused && !teleportMode) {
     updatePlayer(game, delta);
     updateEnemies(game, delta);
     updateBullets(game, delta);
   } else if (gameState.paused) {
     // Still update shield position when paused
     if (game.shieldMesh && game.abilities.shield.active) {
       game.shieldMesh.position.copy(game.player.position);
     }
   }

   game.renderer.render(game.scene, game.camera);
   requestAnimationFrame(animate);

 setGameState(prev => ({
 score: game.score,
 highScore: Math.max(game.score, prev.highScore),
 wave: game.wave,
 enemyCount: game.enemies.length,
 health: Math.max(0, game.player.health),
 paused: prev.paused,
 }));
 };

 animate();

 const onKeyDown = (e) => {
   const key = e.key.toLowerCase();
   game.keys[key] = true;

   if (key === hotkeys.laser && !gameState.paused && !teleportMode) {
     useLaser(game);
   } else if (key === hotkeys.shield && !gameState.paused && !teleportMode) {
     useShield(game);
   } else if (key === hotkeys.skinSpecial && !gameState.paused && !teleportMode) {
     useSkinSpecial(game);
   } else if (key === hotkeys.pause) {
     setGameState(prev => ({ ...prev, paused: !prev.paused }));
   }
 };

 const onKeyUp = (e) => {
   game.keys[e.key.toLowerCase()] = false;
 };

 const onMouseDown = (e) => {
   if (e.button === 2) { // Right click
     e.preventDefault();
     setSniperMode(true);
   }
 };

 const onMouseUp = (e) => {
   if (e.button === 2) { // Right click
     e.preventDefault();
     setSniperMode(false);
   }
 };

 const onContextMenu = (e) => {
   e.preventDefault();
 };

 document.addEventListener('keydown', onKeyDown);
 document.addEventListener('keyup', onKeyUp);
 container.addEventListener('mousedown', onMouseDown);
 container.addEventListener('mouseup', onMouseUp);
 container.addEventListener('contextmenu', onContextMenu);

 const onResize = () => {
 if (!game.camera || !game.renderer) return;
 game.camera.aspect = container.clientWidth / container.clientHeight;
 game.camera.updateProjectionMatrix();
 game.renderer.setSize(container.clientWidth, container.clientHeight);
 };
 window.addEventListener('resize', onResize);

 const shootInterval = setInterval(() => {
   if (game.running && game.initialized && !gameState.paused && !teleportMode && game.controls?.isLocked && !sniperMode) {
     shootBullet(game);
   }
 }, 200);

 return () => {
   document.removeEventListener('keydown', onKeyDown);
   document.removeEventListener('keyup', onKeyUp);
   window.removeEventListener('resize', onResize);
   container.removeEventListener('click', handleClick);
   container.removeEventListener('mousedown', onMouseDown);
   container.removeEventListener('mouseup', onMouseUp);
   container.removeEventListener('contextmenu', onContextMenu);
   clearInterval(shootInterval);
   if (game.renderer && container.contains(game.renderer.domElement)) {
     container.removeChild(game.renderer.domElement);
   }
   game.running = false;
   game.initialized = false;
 };
 }, [gameStarted, gameState.paused, teleportMode, hotkeys, sniperMode]);

useEffect(() => {
  if (!gameStarted || !sniperMode) return;

  const handleClick = (e) => {
    if (e.button === 0 && sniperMode && !gameState.paused && !teleportMode) {
      shootBullet(gameRef.current);
    }
  };

  document.addEventListener('mousedown', handleClick);

  return () => {
    document.removeEventListener('mousedown', handleClick);
  };
}, [gameStarted, sniperMode, gameState.paused, teleportMode]);

 const createArena = (game, arenaType) => {
 const arenaData = arenas[arenaType];

 const floorGeometry = new THREE.PlaneGeometry(100, 100);
 const floorMaterial = new THREE.MeshStandardMaterial({
 color: 0x2c5f2d,
 roughness: 0.8,
 });
 const floor = new THREE.Mesh(floorGeometry, floorMaterial);
 floor.rotation.x = -Math.PI / 2;
 floor.receiveShadow = true;
 game.scene.add(floor);

 const ceilingGeometry = new THREE.PlaneGeometry(100, 100);
 const ceilingMaterial = new THREE.MeshStandardMaterial({
 color: 0x1a1a2e,
 roughness: 0.9,
 });
 const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
 ceiling.rotation.x = Math.PI / 2;
 ceiling.position.y = 10;
 game.scene.add(ceiling);

 const wallHeight = 10;
 const wallMaterial = new THREE.MeshStandardMaterial({
 color: 0x4a7c59,
 roughness: 0.7,
 emissive: 0x2c5f2d,
 emissiveIntensity: 0.2,
 });

 const northWall = new THREE.Mesh(
 new THREE.BoxGeometry(100, wallHeight, 2),
 wallMaterial
 );
 northWall.position.set(0, wallHeight / 2, -50);
 northWall.castShadow = true;
 northWall.receiveShadow = true;
 game.scene.add(northWall);

 const southWall = new THREE.Mesh(
 new THREE.BoxGeometry(100, wallHeight, 2),
 wallMaterial
 );
 southWall.position.set(0, wallHeight / 2, 50);
 southWall.castShadow = true;
 southWall.receiveShadow = true;
 game.scene.add(southWall);

 const eastWall = new THREE.Mesh(
 new THREE.BoxGeometry(2, wallHeight, 100),
 wallMaterial
 );
 eastWall.position.set(50, wallHeight / 2, 0);
 eastWall.castShadow = true;
 eastWall.receiveShadow = true;
 game.scene.add(eastWall);

 const westWall = new THREE.Mesh(
 new THREE.BoxGeometry(2, wallHeight, 100),
 wallMaterial
 );
 westWall.position.set(-50, wallHeight / 2, 0);
 westWall.castShadow = true;
 westWall.receiveShadow = true;
 game.scene.add(westWall);

 game.obstacles = [];
 if (arenaData.obstacles) {
 arenaData.obstacles.forEach(obs => {
 const obstacleGeometry = new THREE.BoxGeometry(obs.width || 4, wallHeight, obs.depth || 4);
 const obstacleMaterial = new THREE.MeshStandardMaterial({
 color: 0x8b4513,
 roughness: 0.8,
 });
 const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
 obstacle.position.set(obs.x || 0, wallHeight / 2, obs.z || 0);
 obstacle.castShadow = true;
 obstacle.receiveShadow = true;
 game.scene.add(obstacle);
 game.obstacles.push(obstacle);
 });
 }

 game.obstacles.push(northWall, southWall, eastWall, westWall);
 };

 const updatePlayer = (game, delta) => {
 if (!game.controls?.isLocked || !game.initialized) return;

 const moveSpeed = game.keys[hotkeys.sprint] ? 20 : 10;
 const velocity = new THREE.Vector3();

 const forward = new THREE.Vector3();
 game.camera.getWorldDirection(forward);
 forward.y = 0;
 forward.normalize();

 const right = new THREE.Vector3();
 right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

 if (game.keys[hotkeys.moveForward]) velocity.add(forward.multiplyScalar(moveSpeed * delta));
 if (game.keys[hotkeys.moveBackward]) velocity.add(forward.multiplyScalar(-moveSpeed * delta));
 if (game.keys[hotkeys.moveLeft]) velocity.add(right.multiplyScalar(-moveSpeed * delta));
 if (game.keys[hotkeys.moveRight]) velocity.add(right.multiplyScalar(moveSpeed * delta));

 // Jump mechanic
 if (game.keys[hotkeys.jump] && !game.player.isJumping) {
 game.player.isJumping = true;
 game.player.verticalVelocity = 8;
 }

 // Apply gravity
 if (game.player.isJumping || game.player.position.y > 1.7) {
 game.player.verticalVelocity -= 25 * delta;
 game.player.position.y += game.player.verticalVelocity * delta;

 if (game.player.position.y <= 1.7) {
 game.player.position.y = 1.7;
 game.player.isJumping = false;
 game.player.verticalVelocity = 0;
 }
 }

 const newPosition = game.player.position.clone().add(velocity);
 
 newPosition.x = Math.max(-48, Math.min(48, newPosition.x));
 newPosition.z = Math.max(-48, Math.min(48, newPosition.z));

 let collided = false;
 game.obstacles?.forEach(obstacle => {
 const box = new THREE.Box3().setFromObject(obstacle);
 const playerBox = new THREE.Box3().setFromCenterAndSize(
 newPosition,
 new THREE.Vector3(1, 2, 1)
 );
 if (box.intersectsBox(playerBox)) {
 collided = true;
 }
 });

 if (!collided) {
 game.player.position.x = newPosition.x;
 game.player.position.z = newPosition.z;
 }
 
 game.camera.position.copy(game.player.position);

 // Update camera FOV for sniper mode
 if (game.camera) {
   game.camera.fov = sniperMode ? 30 : (game.camera.defaultFov || 75);
   game.camera.updateProjectionMatrix();
 }
 };

 const spawnWave = (game) => {
 if (!game.running || !game.initialized || game.waveSpawning) return;

 game.waveSpawning = true;
 const enemiesInWave = 5;
 
 for (let i = 0; i < enemiesInWave; i++) {
 setTimeout(() => {
 if (game.running && game.initialized) {
 spawnEnemy(game);
 }
 if (i === enemiesInWave - 1) {
 game.waveSpawning = false;
 }
 }, i * 1500);
 }
 };

 const spawnEnemy = (game) => {
 if (!game.running || !game.initialized || !game.scene) return;
 
 // Spawn enemies far from player (minimum 25 units away)
 let spawnPos;
 let attempts = 0;
 do {
 const angle = Math.random() * Math.PI * 2;
 const distance = 25 + Math.random() * 20;
 spawnPos = new THREE.Vector3(
 Math.cos(angle) * distance,
 1,
 Math.sin(angle) * distance
 );
 attempts++;
 } while (spawnPos.distanceTo(game.player.position) < 20 && attempts < 10);
 
 const geometry = new THREE.SphereGeometry(0.8, 16, 16);
 const material = new THREE.MeshStandardMaterial({
 color: 0xdc143c,
 emissive: 0xff0000,
 emissiveIntensity: 0.3,
 });
 const mesh = new THREE.Mesh(geometry, material);
 mesh.position.copy(spawnPos);
 mesh.castShadow = true;
 game.scene.add(mesh);

 // Create health bar
 const healthBarGeometry = new THREE.PlaneGeometry(1.5, 0.2);
 const healthBarBackground = new THREE.Mesh(
 healthBarGeometry,
 new THREE.MeshBasicMaterial({ color: 0x000000 })
 );
 healthBarBackground.position.set(0, 1.5, 0);
 
 const healthBarFill = new THREE.Mesh(
 new THREE.PlaneGeometry(1.5, 0.2),
 new THREE.MeshBasicMaterial({ color: 0x00ff00 })
 );
 healthBarFill.position.set(0, 1.5, 0.01);
 
 mesh.add(healthBarBackground);
 mesh.add(healthBarFill);

 game.enemies.push({
 mesh,
 health: 50 + game.wave * 10,
 maxHealth: 50 + game.wave * 10,
 speed: 2 + game.wave * 0.2,
 lastShot: 0,
 healthBarFill,
 moveState: 'chase',
 stateChangeTime: Date.now(),
 targetPosition: null,
 });
 };

 const updateEnemies = (game, delta) => {
 if (!game.initialized) return;
 
 game.enemies = game.enemies.filter(enemy => {
 const distance = enemy.mesh.position.distanceTo(game.player.position);
 
 // AI behavior: switch between chase, strafe, and retreat
 const now = Date.now();
 if (now - enemy.stateChangeTime > 2000) {
 enemy.stateChangeTime = now;
 if (distance < 10) {
 enemy.moveState = Math.random() > 0.5 ? 'strafe' : 'retreat';
 } else if (distance > 25) {
 enemy.moveState = 'chase';
 } else {
 enemy.moveState = Math.random() > 0.3 ? 'strafe' : 'chase';
 }
 
 // Set random strafe target
 if (enemy.moveState === 'strafe') {
 const angle = Math.random() * Math.PI * 2;
 enemy.targetPosition = new THREE.Vector3(
 enemy.mesh.position.x + Math.cos(angle) * 10,
 1,
 enemy.mesh.position.z + Math.sin(angle) * 10
 );
 }
 }
 
 let moveDirection = new THREE.Vector3();
 
 if (enemy.moveState === 'chase' && distance > 15) {
 // Chase player but stop at distance
 moveDirection.subVectors(game.player.position, enemy.mesh.position);
 } else if (enemy.moveState === 'retreat' && distance < 12) {
 // Move away from player
 moveDirection.subVectors(enemy.mesh.position, game.player.position);
 } else if (enemy.moveState === 'strafe' && enemy.targetPosition) {
 // Move to strafe position
 moveDirection.subVectors(enemy.targetPosition, enemy.mesh.position);
 if (moveDirection.length() < 2) {
 enemy.targetPosition = null;
 }
 } else {
 // Maintain distance - slight random movement
 const angle = now * 0.001 + enemy.mesh.id;
 moveDirection.set(Math.cos(angle), 0, Math.sin(angle));
 }
 
 moveDirection.y = 0;
 moveDirection.normalize();
 enemy.mesh.position.add(moveDirection.multiplyScalar(enemy.speed * delta));

 // Keep enemies in bounds
 enemy.mesh.position.x = Math.max(-45, Math.min(45, enemy.mesh.position.x));
 enemy.mesh.position.z = Math.max(-45, Math.min(45, enemy.mesh.position.z));

 // Shoot at player
 if (now - enemy.lastShot > 2500 && distance < 35 && distance > 5) {
 shootEnemyBullet(game, enemy);
 enemy.lastShot = now;
 }

 // Update health bar
 if (enemy.healthBarFill) {
 const healthPercent = enemy.health / enemy.maxHealth;
 enemy.healthBarFill.scale.x = healthPercent;
 enemy.healthBarFill.position.x = -(1.5 - 1.5 * healthPercent) / 2;
 enemy.healthBarFill.material.color.setHex(
 healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000
 );
 // Make health bar face camera
 if (game.camera) {
 enemy.healthBarFill.lookAt(game.camera.position);
 enemy.healthBarFill.parent.lookAt(game.camera.position);
 }
 }

 if (enemy.health <= 0) {
 game.scene.remove(enemy.mesh);
 return false;
 }

 return true;
 });

 if (game.enemies.length === 0 && game.running && !game.waveSpawning) {
 game.wave++;
 game.score += game.wave * 50;
 setTimeout(() => spawnWave(game), 2000);
 }
 };

 const shootBullet = (game) => {
 if (!game.initialized || !game.scene || !game.camera) return;
 
 const geometry = new THREE.SphereGeometry(0.2, 8, 8);
 const material = new THREE.MeshStandardMaterial({
 color: 0xffd700,
 emissive: 0xffd700,
 emissiveIntensity: 0.8,
 });
 const mesh = new THREE.Mesh(geometry, material);
 
 const direction = new THREE.Vector3();
 game.camera.getWorldDirection(direction);
 
 mesh.position.copy(game.camera.position);
 
 game.scene.add(mesh);
 game.bullets.push({
 mesh,
 velocity: direction.multiplyScalar(50),
 isPlayer: true,
 startTime: Date.now(),
 });
 };

 const shootEnemyBullet = (game, enemy) => {
 if (!game.initialized || !game.scene) return;
 
 const geometry = new THREE.SphereGeometry(0.15, 8, 8);
 const material = new THREE.MeshStandardMaterial({
 color: 0xff4500,
 emissive: 0xff4500,
 emissiveIntensity: 0.8,
 });
 const mesh = new THREE.Mesh(geometry, material);
 
 const direction = new THREE.Vector3()
 .subVectors(game.player.position, enemy.mesh.position)
 .normalize();
 
 mesh.position.copy(enemy.mesh.position);
 game.scene.add(mesh);
 game.bullets.push({
 mesh,
 velocity: direction.multiplyScalar(20),
 isPlayer: false,
 startTime: Date.now(),
 });
 };

 const updateBullets = (game, delta) => {
 if (!game.initialized) return;
 
 game.bullets = game.bullets.filter(bullet => {
 bullet.mesh.position.add(bullet.velocity.clone().multiplyScalar(delta));

 if (Date.now() - bullet.startTime > 5000 ||
 Math.abs(bullet.mesh.position.x) > 50 ||
 Math.abs(bullet.mesh.position.z) > 50) {
 game.scene.remove(bullet.mesh);
 return false;
 }

 if (bullet.isPlayer) {
 for (let i = game.enemies.length - 1; i >= 0; i--) {
 const enemy = game.enemies[i];
 const distance = bullet.mesh.position.distanceTo(enemy.mesh.position);
 if (distance < 1) {
 enemy.health -= 75;
 createExplosion(game, bullet.mesh.position);
 if (enemy.health <= 0) {
 game.score += 100;
 game.scene.remove(enemy.mesh);
 game.enemies.splice(i, 1);
 }
 game.scene.remove(bullet.mesh);
 return false;
 }
 }
 } else {
 const distance = bullet.mesh.position.distanceTo(game.player.position);
 if (distance < 1.5) {
 if (!game.abilities.shield.active) {
 game.player.health -= 2 / 3;
 if (game.player.health <= 0) {
 endGame(game);
 }
 }
 game.scene.remove(bullet.mesh);
 return false;
 }
 }

 return true;
 });
 };

 const createExplosion = (game, position) => {
 if (!game.scene) return;
 
 const geometry = new THREE.SphereGeometry(1, 16, 16);
 const material = new THREE.MeshBasicMaterial({
 color: 0xffd700,
 transparent: true,
 opacity: 0.8,
 });
 const explosion = new THREE.Mesh(geometry, material);
 explosion.position.copy(position);
 game.scene.add(explosion);

 let scale = 0.1;
 const expandExplosion = () => {
 scale += 0.3;
 explosion.scale.set(scale, scale, scale);
 material.opacity -= 0.1;
 
 if (material.opacity > 0) {
 requestAnimationFrame(expandExplosion);
 } else {
 if (game.scene) {
 game.scene.remove(explosion);
 }
 }
 };
 expandExplosion();
 };

 const useLaser = (game) => {
 if (!game.initialized) return;
 const now = Date.now();
 if (now - game.abilities.laser.lastUsed < game.abilities.laser.cooldown) return;

 game.abilities.laser.lastUsed = now;

 game.enemies.forEach((enemy, i) => {
 const distance = enemy.mesh.position.distanceTo(game.player.position);
 if (distance < 30) {
 enemy.health -= 75;
 createExplosion(game, enemy.mesh.position);
 if (enemy.health <= 0) {
 game.score += 100;
 }
 }
 });

 game.score += 50;
 };

 const useShield = (game) => {
 if (!game.initialized || !game.scene) return;
 const now = Date.now();
 
 // Toggle shield off if already active
 if (game.abilities.shield.active) {
 game.abilities.shield.active = false;
 if (game.shieldMesh) {
 game.scene.remove(game.shieldMesh);
 game.shieldMesh = null;
 }
 return;
 }
 
 if (now - game.abilities.shield.lastUsed < game.abilities.shield.cooldown) return;
 
 game.abilities.shield.lastUsed = now;
 game.abilities.shield.active = true;
 game.player.health = Math.min(100, game.player.health + 40);
 
 // Create holographic shield effect
 const shieldGeometry = new THREE.SphereGeometry(2.5, 32, 32);
 const shieldMaterial = new THREE.MeshPhongMaterial({
 color: 0x00ffff,
 transparent: true,
 opacity: 0.3,
 emissive: 0x00ffff,
 emissiveIntensity: 0.5,
 side: THREE.DoubleSide,
 wireframe: false,
 shininess: 100,
 });
 
 const shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
 shieldMesh.position.copy(game.player.position);
 game.scene.add(shieldMesh);
 game.shieldMesh = shieldMesh;
 
 // Create inner glow layer
 const innerGlowGeometry = new THREE.SphereGeometry(2.3, 32, 32);
 const innerGlowMaterial = new THREE.MeshBasicMaterial({
 color: 0x00ffff,
 transparent: true,
 opacity: 0.15,
 side: THREE.BackSide,
 });
 const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
 shieldMesh.add(innerGlow);
 
 // Create hexagonal pattern overlay
 const hexGeometry = new THREE.SphereGeometry(2.52, 8, 8);
 const hexMaterial = new THREE.MeshBasicMaterial({
 color: 0x00ffff,
 transparent: true,
 opacity: 0.4,
 wireframe: true,
 });
 const hexMesh = new THREE.Mesh(hexGeometry, hexMaterial);
 shieldMesh.add(hexMesh);
 
 // Animate shield
 const animateShield = () => {
 if (!game.abilities.shield.active || !game.shieldMesh) return;
 
 // Update position to follow player
 game.shieldMesh.position.copy(game.player.position);
 
 // Pulsing effect
 const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 1;
 game.shieldMesh.scale.set(pulse, pulse, pulse);
 
 // Rotation effect
 game.shieldMesh.rotation.y += 0.01;
 hexMesh.rotation.x += 0.02;
 hexMesh.rotation.z -= 0.01;
 
 // Opacity pulsing
 shieldMaterial.opacity = 0.25 + Math.sin(Date.now() * 0.005) * 0.1;
 shieldMaterial.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.004) * 0.2;
 
 requestAnimationFrame(animateShield);
 };
 
 animateShield();
 
 setTimeout(() => {
 game.abilities.shield.active = false;
 if (game.shieldMesh) {
 // Fade out effect
 let opacity = shieldMaterial.opacity;
 const fadeOut = () => {
 opacity -= 0.05;
 shieldMaterial.opacity = opacity;
 hexMaterial.opacity = opacity;
 innerGlowMaterial.opacity = opacity * 0.5;
 
 if (opacity > 0) {
 requestAnimationFrame(fadeOut);
 } else {
 game.scene.remove(game.shieldMesh);
 game.shieldMesh = null;
 }
 };
 fadeOut();
 }
 }, 5000);
 };

 const useSkinSpecial = (game) => {
 if (!game.initialized) return;
 const now = Date.now();
 if (now - game.abilities.skinSpecial.lastUsed < game.abilities.skinSpecial.cooldown) return;

 const skin = skins[game.player.skin];
 
 if (skin.special === 'teleport') {
 setTeleportMode(true);
 game.abilities.skinSpecial.lastUsed = now;
 return;
 }

 game.abilities.skinSpecial.lastUsed = now;
 
 switch (skin.special) {
 case 'slowness_aura':
 game.enemies.forEach(enemy => {
 const distance = enemy.mesh.position.distanceTo(game.player.position);
 if (distance < 15) {
 enemy.speed *= 0.3;
 setTimeout(() => enemy.speed /= 0.3, 3000);
 }
 });
 break;
 case 'emp_blast':
 game.enemies.forEach(enemy => {
 enemy.stunned = true;
 setTimeout(() => enemy.stunned = false, 2000);
 });
 break;
 }
 };

 const handleTeleportClick = (e) => {
 const canvas = e.currentTarget;
 const rect = canvas.getBoundingClientRect();
 const x = e.clientX - rect.left;
 const y = e.clientY - rect.top;

 const worldX = ((x / canvas.offsetWidth) * 100) - 50;
 const worldZ = ((y / canvas.offsetHeight) * 100) - 50;

 const game = gameRef.current;
 game.player.position.set(worldX, 1.7, worldZ);
 game.camera.position.copy(game.player.position);

 setTeleportMode(false);
 
 setTimeout(() => {
 if (game.controls && game.running) {
 game.controls.lock();
 }
 }, 100);
 };

 const endGame = (game) => {
 if (!game.running || !game.initialized) return;
 game.running = false;
 game.initialized = false;
 
 if (game.score > gameState.highScore) {
 localStorage.setItem('arenaGameHighScore', game.score.toString());
 }
 
 setTimeout(() => {
 setGameStarted(false);
 }, 100);
 };

 if (showMapBuilder) {
 return <MapBuilder onBack={() => setShowMapBuilder(false)} customMaps={customMaps} setCustomMaps={setCustomMaps} />;
 }

 if (!gameStarted) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
 <div className="max-w-6xl w-full">
 <div className="text-center mb-12">
 <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 mb-4">
 🏟 ARENA BATTLE 3D
 </h1>
 <p className="text-xl text-gray-300">
 First-Person Combat • Survive the Waves • Master Your Abilities
 </p>
 </div>

 <div className="grid md:grid-cols-2 gap-8 mb-12">
 <div className="bg-black/40 backdrop-blur-lg border-2 border-yellow-500/50 rounded-2xl p-8">
 <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
 Choose Your Fighter
 </h2>
 <div className="grid grid-cols-2 gap-4">
 {Object.entries(skins).map(([key, skin]) => (
 <div
 key={key}
 onClick={() => setSelectedSkin(key)}
 className={`cursor-pointer bg-white/5 border-2 rounded-xl p-6 transition-all hover:scale-105 ${
 selectedSkin === key
 ? 'border-green-400 bg-green-400/10 shadow-lg shadow-green-400/50'
 : 'border-gray-600 hover:border-yellow-400'
 }`}
 >
 <div className="text-5xl text-center mb-3">{skin.icon}</div>
 <div className="text-white font-bold text-center capitalize">
 {key}
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-black/40 backdrop-blur-lg border-2 border-yellow-500/50 rounded-2xl p-8">
 <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
 Choose Your Arena
 </h2>
 <div className="grid grid-cols-2 gap-4">
 {Object.entries(arenas).map(([key, arena]) => (
 <div
 key={key}
 onClick={() => setSelectedArena(key)}
 className={`cursor-pointer bg-white/5 border-2 rounded-xl p-6 transition-all hover:scale-105 ${
 selectedArena === key
 ? 'border-green-400 bg-green-400/10 shadow-lg shadow-green-400/50'
 : 'border-gray-600 hover:border-yellow-400'
 }`}
 >
 <div className="text-4xl text-center mb-3">
 {key === 'classic' ? '🏟' : key === 'fortress' ? '🏰' : key === 'maze' ? '🌀' : '⚙️'}
 </div>
 <div className="text-white font-bold text-center capitalize">
 {arena.name}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="bg-black/40 backdrop-blur-lg border-2 border-yellow-500/50 rounded-2xl p-8 mb-8">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-2xl font-bold text-yellow-400">
 ⌨️ Controls
 </h2>
 <Button
 onClick={() => setShowSettings(!showSettings)}
 className="bg-purple-600 hover:bg-purple-700"
 >
 <Settings className="w-4 h-4 mr-2" />
 Customize Keys
 </Button>
 </div>

 {showSettings ? (
 <div className="grid md:grid-cols-2 gap-3">
 {Object.entries({
 moveForward: 'Move Forward',
 moveBackward: 'Move Backward',
 moveLeft: 'Move Left',
 moveRight: 'Move Right',
 sprint: 'Sprint',
 jump: 'Jump',
 laser: 'Laser Beam',
 shield: 'Toggle Shield',
 skinSpecial: 'Skin Special',
 pause: 'Pause',
 }).map(([action, label]) => (
 <div key={action} className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
 <span className="text-gray-200">{label}</span>
 {editingKey === action ? (
 <Input
 autoFocus
 className="w-16 text-center bg-yellow-400 text-black font-bold"
 value="..."
 onKeyDown={(e) => handleKeyChange(action, e)}
 onBlur={() => setEditingKey(null)}
 />
 ) : (
 <button
 onClick={() => setEditingKey(action)}
 className="font-bold text-yellow-400 bg-black/30 px-4 py-2 rounded hover:bg-yellow-400 hover:text-black transition-all uppercase"
 >
 {hotkeys[action] === ' ' ? 'SPACE' : hotkeys[action]}
 </button>
 )}
 </div>
 ))}
 </div>
 ) : (
 <div className="grid md:grid-cols-2 gap-4 text-gray-200">
 <div className="flex items-center gap-3">
 <span className="font-bold text-yellow-400 bg-black/30 px-3 py-1 rounded uppercase">{hotkeys.moveForward}{hotkeys.moveLeft}{hotkeys.moveBackward}{hotkeys.moveRight}</span>
 <span>Move around</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-bold text-yellow-400 bg-black/30 px-3 py-1 rounded">Mouse</span>
 <span>Look around & aim</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-bold text-yellow-400 bg-black/30 px-3 py-1 rounded uppercase">{hotkeys.sprint}</span>
 <span>Sprint (2x speed)</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-bold text-yellow-400 bg-black/30 px-3 py-1 rounded uppercase">{hotkeys.jump === ' ' ? 'SPACE' : hotkeys.jump}</span>
 <span>Jump</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-bold text-yellow-400 bg-black/30 px-3 py-1 rounded uppercase">{hotkeys.laser}</span>
 <span>Laser Beam</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-bold text-yellow-400 bg-black/30 px-3 py-1 rounded uppercase">{hotkeys.shield}</span>
 <span>Toggle Shield</span>
 </div>
 <div className="flex items-center gap-3">
   <span className="font-bold text-yellow-400 bg-black/30 px-3 py-1 rounded uppercase">{hotkeys.skinSpecial}</span>
   <span>Skin Special {selectedSkin === 'mage' && '(Teleport!)'}</span>
 </div>
 <div className="flex items-center gap-3">
   <span className="font-bold text-yellow-400 bg-black/30 px-3 py-1 rounded">Right Click</span>
   <span>Sniper Mode (Zoom + Manual Aim)</span>
 </div>
 <div className="flex items-center gap-3">
   <span className="font-bold text-yellow-400 bg-black/30 px-3 py-1 rounded uppercase">{hotkeys.pause}</span>
   <span>Pause</span>
 </div>
 </div>
 )}
 </div>

 <div className="text-center space-y-4">
 <button
 onClick={() => setGameStarted(true)}
 className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-black text-2xl px-16 py-6 rounded-2xl border-4 border-yellow-400 shadow-2xl shadow-blue-500/50 transition-all hover:scale-110 hover:shadow-blue-400/70"
 >
 🚀 START GAME
 </button>
 <div>
 <button
 onClick={() => setShowMapBuilder(true)}
 className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white font-bold text-lg px-8 py-3 rounded-xl border-2 border-yellow-400 shadow-xl transition-all hover:scale-105"
 >
 🗺️ CREATE CUSTOM MAP
 </button>
 </div>
 <div className="mt-6 text-yellow-400 text-lg">
 🏆 High Score: {gameState.highScore}
 </div>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="relative w-full h-screen bg-black overflow-hidden">
 <div ref={containerRef} className="w-full h-full" />

 <div className="absolute inset-0 pointer-events-none">
 <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
 <div className="bg-black/80 border-2 border-yellow-400 rounded-xl px-6 py-3 backdrop-blur-sm">
 <div className="text-yellow-400 font-bold">Score: <span className="text-white">{gameState.score}</span></div>
 <div className="text-yellow-400 font-bold">High: <span className="text-white">{gameState.highScore}</span></div>
 <div className="text-yellow-400 font-bold">Wave: <span className="text-white">{gameState.wave}</span></div>
 <div className="text-yellow-400 font-bold">Enemies: <span className="text-white">{gameState.enemyCount}</span></div>
 </div>

 <button
 onClick={() => setGameState(prev => ({ ...prev, paused: !prev.paused }))}
 className="bg-blue-600 hover:bg-blue-700 border-2 border-yellow-400 rounded-xl px-6 py-3 text-white font-bold pointer-events-auto transition-all"
 >
 {gameState.paused ? '▶️ Resume' : '⏸️ Pause'}
 </button>
 </div>

 <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64">
 <div className="bg-black/80 border-2 border-yellow-400 rounded-full h-8 overflow-hidden backdrop-blur-sm">
 <div
 className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
 style={{ width: `${Math.max(0, gameState.health)}%` }}
 />
 </div>
 <div className="text-center text-white font-bold mt-1">
 Health: {Math.round(Math.max(0, gameState.health))}%
 </div>
 </div>

 <div className="absolute bottom-4 right-4 w-48 h-48 bg-black/80 border-2 border-yellow-400 rounded-xl overflow-hidden backdrop-blur-sm">
 <MinimapCanvas gameRef={gameRef} />
 </div>

 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
   <div className="relative">
     {sniperMode ? (
       <>
         <div className="absolute w-16 h-0.5 bg-red-500 -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-red-500/50" />
         <div className="absolute h-16 w-0.5 bg-red-500 -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-red-500/50" />
         <div className="absolute w-12 h-12 border-2 border-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-red-500/50" />
         <div className="absolute w-24 h-24 border border-red-500/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
         <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-red-500 font-bold text-sm whitespace-nowrap bg-black/80 px-3 py-1 rounded-lg">
           🎯 SNIPER MODE
         </div>
       </>
     ) : (
       <>
         <div className="absolute w-8 h-0.5 bg-red-500 -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-red-500/50" />
         <div className="absolute h-8 w-0.5 bg-red-500 -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-red-500/50" />
         <div className="absolute w-2 h-2 border-2 border-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-red-500/50" />
       </>
     )}
   </div>
 </div>

 {!gameRef.current.controls?.isLocked && gameRef.current.initialized && !teleportMode && (
 <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={() => gameRef.current.controls?.lock()}>
 <div className="bg-black/90 border-4 border-yellow-400 rounded-2xl px-12 py-8 text-center">
 <div className="text-3xl font-black text-yellow-400 mb-4">
 Click to Start
 </div>
 <div className="text-gray-300 text-lg">
 Move your mouse to look around
 </div>
 </div>
 </div>
 )}

 {teleportMode && (
 <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto">
 <div className="bg-black/95 border-4 border-purple-500 rounded-2xl p-8 max-w-2xl">
 <div className="text-3xl font-black text-purple-400 mb-4 text-center">
 🧙 Teleport - Choose Location
 </div>
 <div className="text-gray-300 mb-6 text-center">
 Click anywhere on the map to teleport
 </div>
 <div className="relative">
 <TeleportMapCanvas
 gameRef={gameRef}
 onTeleport={handleTeleportClick}
 />
 </div>
 <button
 onClick={() => setTeleportMode(false)}
 className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl border-2 border-yellow-400 transition-all"
 >
 Cancel
 </button>
 </div>
 </div>
 )}

 {gameState.paused && (
 <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md pointer-events-auto">
 <div className="bg-black/90 border-4 border-yellow-400 rounded-2xl px-16 py-12 text-center">
 <div className="text-5xl font-black text-yellow-400 mb-6">
 PAUSED
 </div>
 <button
 onClick={() => {
 setGameStarted(false);
 setGameState(prev => ({ ...prev, paused: false }));
 }}
 className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xl px-12 py-4 rounded-xl border-2 border-yellow-400 pointer-events-auto transition-all hover:scale-105"
 >
 🏠 Main Menu
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}

function MinimapCanvas({ gameRef }) {
 const canvasRef = useRef(null);

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;

 const ctx = canvas.getContext('2d');
 let animationId;

 const drawMinimap = () => {
 if (!gameRef.current.scene || !gameRef.current.initialized) {
 animationId = requestAnimationFrame(drawMinimap);
 return;
 }

 ctx.clearRect(0, 0, canvas.width, canvas.height);

 ctx.strokeStyle = '#ffd700';
 ctx.lineWidth = 2;
 ctx.strokeRect(0, 0, canvas.width, canvas.height);

 ctx.fillStyle = '#8b4513';
 gameRef.current.obstacles?.forEach(obs => {
 try {
 const box = new THREE.Box3().setFromObject(obs);
 const size = new THREE.Vector3();
 const center = new THREE.Vector3();
 box.getSize(size);
 box.getCenter(center);

 const x = ((center.x + 50) / 100) * canvas.width;
 const z = ((center.z + 50) / 100) * canvas.height;
 const w = (size.x / 100) * canvas.width;
 const h = (size.z / 100) * canvas.height;

 ctx.fillRect(x - w / 2, z - h / 2, w, h);
 } catch (e) {
 // Skip if obstacle is invalid
 }
 });

 const playerX = ((gameRef.current.player.position.x + 50) / 100) * canvas.width;
 const playerZ = ((gameRef.current.player.position.z + 50) / 100) * canvas.height;
 
 ctx.fillStyle = '#4169e1';
 ctx.beginPath();
 ctx.arc(playerX, playerZ, 4, 0, Math.PI * 2);
 ctx.fill();
 
 if (gameRef.current.camera) {
 const direction = new THREE.Vector3();
 gameRef.current.camera.getWorldDirection(direction);
 ctx.strokeStyle = '#4169e1';
 ctx.lineWidth = 2;
 ctx.beginPath();
 ctx.moveTo(playerX, playerZ);
 ctx.lineTo(playerX + direction.x * 10, playerZ + direction.z * 10);
 ctx.stroke();
 }

 ctx.fillStyle = '#dc143c';
 gameRef.current.enemies?.forEach(enemy => {
 const enemyX = ((enemy.mesh.position.x + 50) / 100) * canvas.width;
 const enemyZ = ((enemy.mesh.position.z + 50) / 100) * canvas.height;
 ctx.beginPath();
 ctx.arc(enemyX, enemyZ, 3, 0, Math.PI * 2);
 ctx.fill();
 });

 animationId = requestAnimationFrame(drawMinimap);
 };

 drawMinimap();

 return () => {
 if (animationId) {
 cancelAnimationFrame(animationId);
 }
 };
 }, [gameRef]);

 return (
 <canvas
 ref={canvasRef}
 width={192}
 height={192}
 className="w-full h-full"
 />
 );
}

function TeleportMapCanvas({ gameRef, onTeleport }) {
 const canvasRef = useRef(null);

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;

 const ctx = canvas.getContext('2d');

 const drawMap = () => {
 if (!gameRef.current.scene || !gameRef.current.initialized) return;

 ctx.clearRect(0, 0, canvas.width, canvas.height);

 ctx.fillStyle = '#1a1a2e';
 ctx.fillRect(0, 0, canvas.width, canvas.height);

 ctx.strokeStyle = '#ffd700';
 ctx.lineWidth = 4;
 ctx.strokeRect(0, 0, canvas.width, canvas.height);

 ctx.strokeStyle = '#333';
 ctx.lineWidth = 1;
 for (let i = 1; i < 10; i++) {
 const pos = (i / 10) * canvas.width;
 ctx.beginPath();
 ctx.moveTo(pos, 0);
 ctx.lineTo(pos, canvas.height);
 ctx.stroke();
 ctx.beginPath();
 ctx.moveTo(0, pos);
 ctx.lineTo(canvas.width, pos);
 ctx.stroke();
 }

 ctx.fillStyle = '#8b4513';
 ctx.strokeStyle = '#654321';
 ctx.lineWidth = 2;
 gameRef.current.obstacles?.forEach(obs => {
 try {
 const box = new THREE.Box3().setFromObject(obs);
 const size = new THREE.Vector3();
 const center = new THREE.Vector3();
 box.getSize(size);
 box.getCenter(center);

 const x = ((center.x + 50) / 100) * canvas.width;
 const z = ((center.z + 50) / 100) * canvas.height;
 const w = (size.x / 100) * canvas.width;
 const h = (size.z / 100) * canvas.height;

 ctx.fillRect(x - w / 2, z - h / 2, w, h);
 ctx.strokeRect(x - w / 2, z - h / 2, w, h);
 } catch (e) {
 // Skip if obstacle is invalid
 }
 });

 const playerX = ((gameRef.current.player.position.x + 50) / 100) * canvas.width;
 const playerZ = ((gameRef.current.player.position.z + 50) / 100) * canvas.height;
 
 const gradient = ctx.createRadialGradient(playerX, playerZ, 0, playerX, playerZ, 20);
 gradient.addColorStop(0, 'rgba(65, 105, 225, 0.6)');
 gradient.addColorStop(1, 'rgba(65, 105, 225, 0)');
 ctx.fillStyle = gradient;
 ctx.fillRect(0, 0, canvas.width, canvas.height);
 
 ctx.fillStyle = '#4169e1';
 ctx.strokeStyle = '#ffd700';
 ctx.lineWidth = 3;
 ctx.beginPath();
 ctx.arc(playerX, playerZ, 8, 0, Math.PI * 2);
 ctx.fill();
 ctx.stroke();

 ctx.fillStyle = '#dc143c';
 ctx.strokeStyle = '#8b0000';
 ctx.lineWidth = 2;
 gameRef.current.enemies?.forEach(enemy => {
 const enemyX = ((enemy.mesh.position.x + 50) / 100) * canvas.width;
 const enemyZ = ((enemy.mesh.position.z + 50) / 100) * canvas.height;
 ctx.beginPath();
 ctx.arc(enemyX, enemyZ, 6, 0, Math.PI * 2);
 ctx.fill();
 ctx.stroke();
 });
 };

 drawMap();
 }, [gameRef]);

 return (
 <canvas
 ref={canvasRef}
 width={512}
 height={512}
 onClick={onTeleport}
 className="w-full h-full cursor-crosshair border-2 border-purple-400 rounded-lg hover:border-purple-300"
 />
 );
}