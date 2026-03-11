/** Minecraft Scroller - v20.0 (Fast Shield Reload) */
const Audio = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    play(freq, type, duration, vol=0.1) {
        if(this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    jump() { this.play(400, 'square', 0.2); },
    coin() { this.play(800, 'sine', 0.1, 0.05); this.play(1200, 'sine', 0.2, 0.05); },
    hit() { this.play(100, 'sawtooth', 0.2, 0.2); },
    dragonHit() { this.play(60, 'sawtooth', 0.5, 0.3); },
    shoot() { this.play(600, 'sine', 0.1, 0.05); },
    block() { this.play(200, 'square', 0.1, 0.1); }
};

window.startGame=()=>{const n=document.getElementById('player-name');gameState.playerName=n.value.trim().toUpperCase()||'STEVE';document.getElementById('main-menu').style.display='none';resetGame();};
window.resumeGame=()=>{document.getElementById('pause-menu').style.display='none';if(sceneRef)sceneRef.physics.resume();gameState.isPaused=false;};
window.restartLevel=()=>{document.getElementById('game-over').style.display='none';document.getElementById('pause-menu').style.display='none';resetLevel();};
window.nextLevel=()=>{document.getElementById('level-clear').style.display='none';gameState.level++;if(gameState.level>6)showVictory();else resetLevel();};
window.quitToMenu=()=>{location.reload();};
window.showLeaderboard=()=>{const s=JSON.parse(localStorage.getItem('mc_scores_v2')||'[]');document.getElementById('leaderboard-list').innerHTML=s.map((v,i)=>`<div class="leaderboard-entry"><span>${i+1}. ${v.name}</span><span style="color:#ffff55;">${v.time.toFixed(2)}s</span></div>`).join('')||'No scores!';document.getElementById('main-menu').style.display='none';document.getElementById('top-players').style.display='block';};
window.hideLeaderboard=()=>{document.getElementById('top-players').style.display='none';document.getElementById('main-menu').style.display='block';};
window.jumpToBoss=()=>{document.getElementById('level-clear').style.display='none';document.getElementById('game-over').style.display='none';document.getElementById('pause-menu').style.display='none';gameState.level=6;gameState.coins=0;updateHUD();resetLevel();};
window.sendFeedback=()=>{const r="turtle-tech-lgtm/craftmine",t=encodeURIComponent("Feedback from "+(gameState.playerName||"Steve")),b=encodeURIComponent("## Game Feedback\n\n**Player:** "+(gameState.playerName||"Steve")+"\n**Level reached:** "+gameState.level+"\n\n**Message:**\n(Enter your feedback here)");window.open(`https://github.com/${r}/issues/new?title=${t}&body=${b}`,'_blank');};

const config={type:Phaser.AUTO,width:800,height:600,parent:'game-container',physics:{default:'arcade',arcade:{gravity:{y:1400},debug:false}},scene:{preload:function(){sceneRef=this;},create:create,update:update}};
let gameState={level:1,coins:0,hp:3,totalTime:0,elapsedTime:0,startTime:0,isPaused:false,gameOver:false,shieldActive:false,shieldReloading:false,playerInvuln:false,lastFired:0,isStarted:false,isBossLevel:false,dragonHp:10,dragonInvuln:false,playerName:'STEVE'};
let player,platforms,coins,enemies,arrows,enemyArrows,cursors,keys,sceneRef,shieldSprite,dragon,fireballs,bossBar,bossBarBg,bossText,bossGroup;

function create(){
    const scene=this;const colors={dirt:'#5d3a1a',grass:'#3e8914',shirt:'#00a8a8',pants:'#3c44aa',skin:'#ffdbac',hair:'#3d2510',zombie:'#4a7a4a',creeper:'#00ff00',coin:'#ffd700',wood:'#7d4d1e',iron:'#ced4da',skeleton:'#d1d1d1',endstone:'#eeeeaa',endstone_spec:'#d8d8a0'};
    const draw=(name,w,h,fn)=>{const c=scene.textures.createCanvas(name,w,h);fn(c.context);c.refresh();};
    draw('grass',16,16,ctx=>{ctx.fillStyle=colors.dirt;ctx.fillRect(0,0,16,16);ctx.fillStyle=colors.grass;ctx.fillRect(0,0,16,6);});
    draw('endstone',16,16,ctx=>{ctx.fillStyle=colors.endstone;ctx.fillRect(0,0,16,16);ctx.fillStyle=colors.endstone_spec;ctx.fillRect(2,2,3,2);ctx.fillRect(10,4,2,3);ctx.fillRect(5,10,4,2);ctx.fillRect(12,12,2,2);});
    draw('player',16,32,ctx=>{ctx.fillStyle=colors.skin;ctx.fillRect(4,0,8,8);ctx.fillStyle=colors.hair;ctx.fillRect(4,0,8,2);ctx.fillStyle='#fff';ctx.fillRect(5,3,2,1);ctx.fillRect(9,3,2,1);ctx.fillStyle='#444';ctx.fillRect(6,3,1,1);ctx.fillRect(10,3,1,1);ctx.fillStyle=colors.shirt;ctx.fillRect(4,8,8,12);ctx.fillStyle=colors.pants;ctx.fillRect(4,20,8,12);ctx.fillStyle=colors.shirt;ctx.fillRect(0,8,4,10);ctx.fillRect(12,8,4,10);});
    draw('zombie',16,32,ctx=>{ctx.fillStyle=colors.zombie;ctx.fillRect(4,0,8,8);ctx.fillStyle='#00a8a8';ctx.fillRect(4,8,8,12);ctx.fillStyle='#3c44aa';ctx.fillRect(4,20,8,12);ctx.fillStyle=colors.zombie;ctx.fillRect(0,8,4,4);ctx.fillRect(12,8,4,4);});
    draw('creeper',16,24,ctx=>{ctx.fillStyle=colors.creeper;ctx.fillRect(4,0,8,8);ctx.fillRect(4,8,8,10);ctx.fillRect(2,18,12,6);ctx.fillStyle='#000';ctx.fillRect(5,2,2,2);ctx.fillRect(9,2,2,2);ctx.fillRect(7,4,2,4);});
    draw('skeleton',16,32,ctx=>{ctx.fillStyle=colors.skeleton;ctx.fillRect(4,0,8,8);ctx.fillRect(4,8,8,12);ctx.fillRect(4,20,8,12);ctx.fillRect(0,8,4,10);ctx.fillRect(12,8,4,10);ctx.fillStyle='#000';ctx.fillRect(5,2,2,2);ctx.fillRect(9,2,2,2);});
    draw('coin',16,16,ctx=>{ctx.fillStyle=colors.coin;ctx.beginPath();ctx.arc(8,8,6,0,Math.PI*2);ctx.fill();});
    draw('arrow',16,8,ctx=>{ctx.fillStyle='#fff';ctx.fillRect(10,3,6,2);ctx.fillStyle='#5d3a1a';ctx.fillRect(4,3,8,2);});
    draw('swipe',32,32,ctx=>{ctx.strokeStyle='rgba(255,255,255,0.8)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(16,16,14,-Math.PI/2,Math.PI/2);ctx.stroke();});
    draw('shield',12,20,ctx=>{ctx.fillStyle=colors.wood;ctx.fillRect(0,0,12,20);ctx.strokeStyle=colors.iron;ctx.lineWidth=2;ctx.strokeRect(1,1,10,18);ctx.fillStyle=colors.iron;ctx.fillRect(5,4,2,12);});
    draw('pickaxe',16,16,ctx=>{ctx.fillStyle=colors.iron;ctx.fillRect(2,2,12,4);ctx.fillRect(6,0,4,8);ctx.fillStyle=colors.wood;ctx.fillRect(7,6,2,10);});
    draw('dragon',64,32,ctx=>{ctx.fillStyle='#000';ctx.fillRect(10,10,40,12);ctx.fillRect(0,5,16,12);ctx.fillRect(40,12,24,4);ctx.fillStyle='#a0a';ctx.fillRect(4,8,4,4);ctx.fillStyle='#222';ctx.fillRect(20,0,16,10);ctx.fillRect(20,22,16,10);});
    draw('fireball',16,16,ctx=>{ctx.fillStyle='#a0a';ctx.beginPath();ctx.arc(8,8,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(6,6,3,0,Math.PI*2);ctx.fill();});

    this.cameras.main.setBackgroundColor('#87CEEB');
    platforms=this.physics.add.staticGroup();coins=this.physics.add.group();enemies=this.physics.add.group();arrows=this.physics.add.group();enemyArrows=this.physics.add.group();fireballs=this.physics.add.group();bossGroup=this.physics.add.group();
    player=this.physics.add.sprite(100,400,'player').setScale(1.5).setCollideWorldBounds(true);
    shieldSprite=this.add.sprite(0,0,'shield').setScale(1.5).setVisible(false).setDepth(1);
    bossBarBg=this.add.rectangle(400,40,400,20,0x000000).setScrollFactor(0).setVisible(false).setDepth(10);
    bossBar=this.add.rectangle(200,40,400,20,0xaa00aa).setScrollFactor(0).setVisible(false).setDepth(11).setOrigin(0,0.5);
    bossText=this.add.text(400,40,'ENDER DRAGON: 10/10',{fontSize:'16px',color:'#fff'}).setScrollFactor(0).setVisible(false).setDepth(12).setOrigin(0.5);

    const ni=document.getElementById('player-name');if(ni){const sp=(e)=>e.stopPropagation();ni.addEventListener('keydown',sp);ni.addEventListener('keyup',sp);ni.addEventListener('keypress',sp);ni.addEventListener('focus',()=>{scene.input.keyboard.enabled=false;scene.input.keyboard.removeCapture('W,A,S,D,J,K,L,U,I,ESC');});ni.addEventListener('blur',()=>{scene.input.keyboard.enabled=true;scene.input.keyboard.addCapture('W,A,S,D,J,K,L,U,I,ESC');});}
    cursors=this.input.keyboard.createCursorKeys();keys=this.input.keyboard.addKeys('W,A,S,D,J,K,L,U,I,ESC');
    
    this.physics.add.collider(player,platforms);this.physics.add.collider(enemies,platforms);this.physics.add.collider(coins,platforms);
    this.physics.add.collider(arrows,platforms,a=>a.destroy());this.physics.add.collider(enemyArrows,platforms,a=>a.destroy());this.physics.add.collider(fireballs,platforms,f=>f.destroy());
    this.physics.add.overlap(player,coins,(p,c)=>{c.destroy();gameState.coins++;Audio.coin();updateHUD();if(gameState.coins>=20)levelClear();});
    
    const hC=(p,s,isP=false)=>{
        if(gameState.playerInvuln)return;
        const iF=(p.flipX&&s.x<p.x)||(!p.flipX&&s.x>p.x);
        if(gameState.shieldActive&&iF&&!gameState.shieldReloading){Audio.block();if(!isP)s.setVelocityX(s.x<p.x?-600:600);tSR();return;}
        takeDamage(1);if(isP)s.destroy();
    };
    this.physics.add.overlap(player,enemies,(p,e)=>hC(p,e,false));
    this.physics.add.overlap(player,enemyArrows,(p,a)=>hC(p,a,true));
    this.physics.add.overlap(player,fireballs,(p,f)=>hC(p,f,true));
    this.physics.add.overlap(arrows,enemies,(a,e)=>{a.destroy();hitEnemy(e);});
    this.physics.add.overlap(arrows,bossGroup,(a,d)=>{a.destroy();hitDragon();});
    
    generateLevel(this);this.physics.pause();updateHUD();
}

function tSR(){
    gameState.shieldReloading=true;gameState.shieldActive=false;shieldSprite.setVisible(false);
    gameState.playerInvuln=true;sceneRef.time.delayedCall(300,()=>gameState.playerInvuln=false);
    sceneRef.time.delayedCall(1000,()=>{gameState.shieldReloading=false;});
}

function generateLevel(scene){
    gameState.isBossLevel=false;platforms.clear(true,true);coins.clear(true,true);enemies.clear(true,true);fireballs.clear(true,true);bossGroup.clear(true,true);enemyArrows.clear(true,true);
    bossBar.setVisible(false);bossBarBg.setVisible(false);bossText.setVisible(false);gameState.coins=0;updateHUD();scene.cameras.main.setBackgroundColor('#87CEEB');
    const w=5000;scene.physics.world.setBounds(0,0,w,800);scene.cameras.main.setBounds(0,0,w,600);
    for(let x=0;x<w;x+=32)if(Math.random()>0.1||x<600)platforms.create(x,584,'grass').setScale(2).refreshBody();
    for(let i=0;i<40;i++){let rx=Phaser.Math.Between(600,w-500),ry=Phaser.Math.Between(250,450),rw=Phaser.Math.Between(3,8);for(let j=0;j<rw;j++)platforms.create(rx+(j*32),ry,'grass').setScale(2).refreshBody();}
    player.setPosition(100,400);player.setVelocity(0,0);scene.cameras.main.startFollow(player,true,0.1,0.1);
    for(let i=0;i<30;i++)coins.create(Phaser.Math.Between(200,w-100),Phaser.Math.Between(100,500),'coin').setScale(1.5).setBounceY(0.4);
    for(let i=0;i<15+(gameState.level*3);i++){let x=Phaser.Math.Between(800,w-200),r=Math.random(),type='zombie';if(r>0.7)type='creeper';else if(r>0.4)type='skeleton';let e=enemies.create(x,400,type);e.type=type;e.setCollideWorldBounds(true);e.health=type==='zombie'?2:1;e.lastShot=0;}
}

function startBossLevel(scene){
    if(gameState.playerName==='UNLUCKY'){die();return;}
    gameState.isBossLevel=true;gameState.dragonHp=10;gameState.dragonInvuln=false;platforms.clear(true,true);coins.clear(true,true);enemies.clear(true,true);fireballs.clear(true,true);bossGroup.clear(true,true);enemyArrows.clear(true,true);
    scene.cameras.main.setBackgroundColor('#110022');bossBarBg.setVisible(true);bossBar.setVisible(true).width=400;bossText.setVisible(true).setText('ENDER DRAGON: 10/10');
    const w=800;scene.physics.world.setBounds(0,0,w,600);scene.cameras.main.setBounds(0,0,w,600);
    for(let x=0;x<w;x+=32)platforms.create(x,584,'endstone').setScale(2).refreshBody();
    for(let y=400;y<=584;y+=32){platforms.create(150,y,'endstone').setScale(2).setTint(0x990099).refreshBody();platforms.create(650,y,'endstone').setScale(2).setTint(0x990099).refreshBody();}
    player.setPosition(400,500);player.setVelocity(0,0);scene.cameras.main.startFollow(player,true,0.1,0.1);
    dragon=bossGroup.create(400,100,'dragon').setScale(3);dragon.body.allowGravity=false;dragon.setCollideWorldBounds(true);dragon.setVelocityX(200);dragon.setBounce(1,1);updateHUD();
}

function update(time,delta){
    if(gameState.isPaused||gameState.gameOver||!gameState.isStarted)return;
    if(keys.A.isDown||cursors.left.isDown){player.setVelocityX(-250);player.flipX=true;}else if(keys.D.isDown||cursors.right.isDown){player.setVelocityX(250);player.flipX=false;}else player.setVelocityX(0);
    const grounded=player.body.touching.down||player.body.blocked.down;
    if((keys.W.isDown||cursors.up.isDown||cursors.space.isDown)&&grounded){player.setVelocityY(-750);player.setScale(1.2,1.8);Audio.jump();}else if(grounded)player.setScale(1.5);
    coins.getChildren().forEach(c=>{if(Phaser.Math.Distance.Between(player.x,player.y,c.x,c.y)<180)sceneRef.physics.moveToObject(c,player,400);});
    if(player.y>750)takeDamage(3);
    if(Phaser.Input.Keyboard.JustDown(keys.J))swingSword();if(Phaser.Input.Keyboard.JustDown(keys.U))usePickaxe();if(Phaser.Input.Keyboard.JustDown(keys.I))placeBlock();
    if(keys.K.isDown&&time>gameState.lastFired){fireArrow();gameState.lastFired=time+500;}
    gameState.shieldActive=keys.L.isDown&&!gameState.shieldReloading;
    shieldSprite.setPosition(player.x+(player.flipX?-15:15),player.y).setVisible(gameState.shieldActive).setFlipX(player.flipX);
    enemies.getChildren().forEach(e=>{let d=Phaser.Math.Distance.Between(player.x,player.y,e.x,e.y);if(d<400){if(e.type==='skeleton'){e.setVelocityX(d<200?(player.x<e.x?100:-100):(player.x<e.x?-100:100));if(time>e.lastShot){let a=enemyArrows.create(e.x,e.y,'arrow');a.body.allowGravity=false;a.setVelocityX(player.x<e.x?-300:300);a.setFlipX(player.x<e.x);e.lastShot=time+2000;Audio.shoot();}}else{e.setVelocityX(player.x<e.x?-110:110);if(e.type==='creeper'&&d<70)explodeCreeper(e);}}else e.setVelocityX(0);});
    if(gameState.isBossLevel&&dragon&&dragon.active){dragon.flipX=dragon.body.velocity.x<0;dragon.y=100+Math.sin(time/200)*80;if(Math.random()<0.04&&fireballs.countActive(true)<3){let f=fireballs.create(dragon.x,dragon.y+20,'fireball').setScale(1.5);f.body.allowGravity=false;sceneRef.physics.moveToObject(f,player,400);Audio.shoot();}}
    gameState.elapsedTime=(time-gameState.startTime)/1000;updateHUD();if(Phaser.Input.Keyboard.JustDown(keys.ESC))pauseGame();
}

function swingSword(){
    sceneRef.cameras.main.shake(100,0.002);let s=sceneRef.add.sprite(player.x+(player.flipX?-30:30),player.y,'swipe').setScale(1.2);s.flipX=player.flipX;sceneRef.tweens.add({targets:s,alpha:0,scale:1.8,duration:150,onComplete:()=>s.destroy()});
    enemies.getChildren().forEach(e=>{if(Phaser.Math.Distance.Between(player.x,player.y,e.x,e.y)<100&&(player.flipX?e.x<player.x:e.x>player.x))hitEnemy(e);});
    if(gameState.isBossLevel&&dragon&&dragon.active&&Phaser.Math.Distance.Between(player.x,player.y,dragon.x,dragon.y)<120&&(player.flipX?dragon.x<player.x:dragon.x>player.x))hitDragon();
    Audio.play(200, 'sawtooth', 0.1, 0.1);
}
function hitEnemy(e){e.health--;e.setTint(0xff0000);Audio.hit();sceneRef.time.delayedCall(100,()=>e.active&&e.clearTint());if(e.health<=0)e.destroy();}
function hitDragon(){
    if(gameState.dragonInvuln||!dragon.active)return;gameState.dragonInvuln=true;gameState.dragonHp--;Audio.dragonHit();dragon.setTint(0xff0000);sceneRef.cameras.main.flash(150,255,0,0);bossBar.width=(gameState.dragonHp/10)*400;bossText.setText(`ENDER DRAGON: ${gameState.dragonHp}/10`);
    sceneRef.time.delayedCall(1000,()=>{if(dragon&&dragon.active){dragon.clearTint();gameState.dragonInvuln=false;}});if(gameState.dragonHp<=0){dragon.destroy();bossText.setVisible(false);bossBar.setVisible(false);bossBarBg.setVisible(false);sceneRef.cameras.main.flash(500,255,255,255);sceneRef.time.delayedCall(500,levelClear);}
}
function usePickaxe(){Audio.play(150, 'sawtooth', 0.1, 0.1);let px=player.x+(player.flipX?-40:40),py=player.y+20,p=sceneRef.add.sprite(px,player.y,'pickaxe').setScale(1.5);p.flipX=player.flipX;sceneRef.tweens.add({targets:p,angle:player.flipX?-90:90,duration:100,yoyo:true,onComplete:()=>p.destroy()});platforms.getChildren().forEach(b=>{if(Phaser.Math.Distance.Between(px,py,b.x,b.y)<40)b.destroy();});}
function placeBlock(){Audio.play(300, 'sine', 0.1, 0.1);let bx=Math.round((player.x+(player.flipX?-48:48))/32)*32,by=Math.round((player.y+16)/32)*32,b=platforms.create(bx,by,gameState.isBossLevel?'endstone':'grass').setScale(2).refreshBody();}
function fireArrow(){Audio.shoot();sceneRef.tweens.add({targets:player,scaleX:1.8,scaleY:1.2,duration:100,yoyo:true});let a=arrows.create(player.x,player.y,'arrow');a.body.allowGravity=false;if(gameState.isBossLevel){a.setVelocityY(-650);a.setAngle(-90);}else{a.setVelocityX(player.flipX?-650:650);a.setFlipX(player.flipX);}}
function explodeCreeper(e){e.setTint(0xffffff);sceneRef.time.delayedCall(500,()=>{if(!e.active)return;if(Phaser.Math.Distance.Between(player.x,player.y,e.x,e.y)<130&&!gameState.shieldActive)takeDamage(2);Audio.play(50, 'sawtooth', 0.5, 0.5);sceneRef.cameras.main.shake(200,0.02);e.destroy();});}

function takeDamage(a){
    if(gameState.playerInvuln) return;
    gameState.hp-=a; gameState.playerInvuln=true;Audio.hit();
    player.setAlpha(0.5); player.setTint(0xff0000); sceneRef.cameras.main.flash(200,255,0,0);
    sceneRef.time.delayedCall(500,()=>{ if(player.active){player.setAlpha(1);player.clearTint();gameState.playerInvuln=false;} });
    if(gameState.hp<=0)die();
    updateHUD();
}

function updateHUD(){let l=`Level: ${gameState.level} | Coins: ${gameState.coins}/20`,h=document.getElementById('hud');if(gameState.isBossLevel){l=`BOSS FIGHT`;h.style.color='white';h.style.textShadow='2px 2px #000';}else{h.style.color='#222';h.style.textShadow='1px 1px #fff';}document.getElementById('stats-left').innerText=l;document.getElementById('stats-right').innerText=`Time: ${(gameState.totalTime+(gameState.isStarted?gameState.elapsedTime:0)).toFixed(1)}s | HP: ${'❤️'.repeat(Math.max(0,gameState.hp))}`;}
function levelClear(){
    gameState.totalTime+=gameState.elapsedTime;
    if(gameState.isBossLevel) showVictory();
    else { document.getElementById('level-clear').style.display='block'; document.getElementById('level-time').innerText=`Time: ${gameState.elapsedTime.toFixed(2)}s`; }
    sceneRef.physics.pause();
}
function die(){gameState.gameOver=true;document.getElementById('game-over').style.display='block';sceneRef.physics.pause();}
function pauseGame(){gameState.isPaused=true;document.getElementById('pause-menu').style.display='block';sceneRef.physics.pause();}
function showVictory(){document.getElementById('victory-screen').style.display='block';document.getElementById('winner-name').innerText=`WINNER: ${gameState.playerName}`;document.getElementById('total-time').innerText=`Final Time: ${gameState.totalTime.toFixed(2)}s`;let s=JSON.parse(localStorage.getItem('mc_scores_v2')||'[]');s.push({name:gameState.playerName,time:gameState.totalTime});s.sort((a,b)=>a.time-b.time);localStorage.setItem('mc_scores_v2',JSON.stringify(s.slice(0,5)));}
function resetGame(){gameState.level=1;gameState.totalTime=0;gameState.hp=3;gameState.isBossLevel=false;resetLevel();}
function resetLevel(){gameState.gameOver=false;gameState.isPaused=false;gameState.playerInvuln=false;gameState.hp=3;gameState.startTime=sceneRef.time.now;gameState.elapsedTime=0;gameState.isStarted=true;sceneRef.physics.resume();if(gameState.level===6)startBossLevel(sceneRef);else generateLevel(sceneRef);}
new Phaser.Game(config);
