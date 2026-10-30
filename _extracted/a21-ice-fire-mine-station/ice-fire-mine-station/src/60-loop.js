/* ============================================================
   60 · LOOP
   ============================================================ */
buildOutlines();

/* 预热编译，避免首帧卡顿 */
renderer.compile(scene, camera);

const _q = new URLSearchParams(location.search);
const FIXED_T = _q.get('t') ? parseFloat(_q.get('t')) : null;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = FIXED_T !== null ? FIXED_T : clock.elapsedTime;
  for (let i = 0; i < updaters.length; i++) updaters[i](dt, t);
  adaptQuality(dt);
  controls.update();
  composer.render();
}
animate();

/* 首帧后淡入 */
requestAnimationFrame(() => {
  setTimeout(() => document.body.classList.add('ready'), 120);
});
