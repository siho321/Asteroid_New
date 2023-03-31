import kaboom from "kaboom"

// initialize context
kaboom(
  { scale: 1.25 }
);

// load image resources
let images = ['rocket.png',
              'bullet.png',
              'asteroid_large.png',
              'asteroid_medium.png',
              'asteroid_small.png',
              'wormhole.png',
              'space.png']

loadRoot('sprites/');
images.forEach(function(image_file){
  let sprite_name = image_file.split('.')[0];
  loadSprite(sprite_name,image_file);
})

// function to return a random (x,y) position
// input: max width (w) and max height (h)
function random_xy(w,h){
  var x = w*Math.random();
  var y = h*Math.random();
  return vec2(x,y);
}

// function to return distance between two positions
// input: two position coordinates
function calc_distance(pos_a,pos_b){
  var x1 = pos_a.x;
  var y1 = pos_a.y;
  var x2 = pos_b.x;
  var y2 = pos_b.y;
  return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
}

// function to return (x,y) position that is farther than
// a given distance from a target object
// input: position of a target object and the min distance from it
function set_safe_distance(pos,min_distance){
  let unsafe = true;
  while(unsafe){
    var x = Math.random()*width();
    var y = Math.random()*height();
    var pos_a = vec2(x,y);
    var pos_b = pos;
    var distance = calc_distance(
      pos_a,pos_b)
    if(distance>min_distance) return pos_a;
  }
}

// function to create an asteroand return it
// input: asteroid's unique name and its position
function make_asteroid(name,position) {
  var asteroid = add([
    sprite(name),
    pos(position),
    rotate(Math.random()*360),
    origin('center'),
    scale(0.25),
    area(),
    solid(),
    name,
    'shot',
    'off_screen',
    {
      speed: 0.1*(2+8*Math.random()),
    }
  ]);
  return asteroid;
}

// function to create a wormhole and return it
// input: wormhole's unique name, its entrance (pos_this)
// and exit (pos_other) positions
function make_wormhole(name,pos_this,pos_other){
  var wormhole = add([
    sprite('wormhole'),
    pos(pos_this),
    rotate(0),
    origin('center'),
    scale(0.4),
    solid(),
    area(),
    name,
    'swirl',
    {
      pos_the_other: pos_other,
    }
  ]); 
  return wormhole
}

// rocket destruction routine
function kill(r) {
    r.lives --;
    if(r.lives<=0){
      destroy(r);
    }
  }

// construction of main game scene
scene('main',()=>{

  // three layers of background ('background'), game objects ('play'),
  // and information display ('score')
  layers(['background','play','score'],'play');
  add([sprite('space'),layer('background')]);

  // ui-layer for information display (score, etc.)
  let score = 0;
  ui = add([layer('score')]);
  ui.on('draw',()=>{
    drawText({
      text:'Score: '+score+'   Rockets: '+rocket.lives,
      size:20,
      pos:vec2(10,10),
    });
  });

  // construction of rocket 
  const rocket = add([
    sprite('rocket'),
    pos(random_xy(width(),height())),
    rotate(0),
    origin('center'),
    scale(0.5),
    solid(),
    area(),
    'rocket',
    'off_screen',
    {
      rotation_speed: 2,
      speed: 5,
      lives: 3,
      bullet_cooldown: 0.25,
      bullet_ready: true,
      is_warping: false,
    }
  ]);

  // rocket control: rotation and moving forward/backward
  onKeyDown('left',()=>{
    rocket.angle -= rocket.rotation_speed;
    console.log(rocket.angle);
  });
  onKeyDown('right',()=>{
    rocket.angle += rocket.rotation_speed;
    console.log(rocket.angle);
  });
  onKeyDown('up',()=>{
    rocket.pos.x += rocket.speed*Math.sin(rocket.angle*3.14/180);
    rocket.pos.y -= rocket.speed*Math.cos(rocket.angle*3.14/180);
  });
  onKeyDown('down',()=>{
    rocket.pos.x -= rocket.speed*Math.sin(rocket.angle*3.14/180);
    rocket.pos.y += rocket.speed*Math.cos(rocket.angle*3.14/180);
  });

  // shooting bullet
  onKeyDown('space', ()=>{
    if(rocket.bullet_ready){
      add([
        sprite('bullet'),
        pos(rocket.pos),
        rotate(rocket.angle),
        origin('center'),
        scale(0.45),
        area(),
        'bullet',
        'shot',
        'hit',
        {
          speed: 10,
        }
        
      ]);  
      rocket.bullet_ready = false;
      wait(rocket.bullet_cooldown, () => {
        rocket.bullet_ready = true;
      });
    }
  });

  // updating bullet flight
  onUpdate('shot',(e)=>{
    e.pos.x += e.speed*Math.sin(e.angle*3.14/180);
    e.pos.y -= e.speed*Math.cos(e.angle*3.14/180);
  });

  // off-screen movement of rocket and asteroids
  onUpdate('off_screen', (e)=>{
    if(e.pos.x > width()){
      e.pos.x = 0;
    }
    if(e.pos.x < 0){
      e.pos.x = width();
    }
    if(e.pos.y > height()){
      e.pos.y = 0;
    }
    if(e.pos.y < 0){
      e.pos.y = height();
    }
  });

  // construction of asteroids
  const n_asteroids = 20;
  const possible_sizes = ['_large','_medium','_small']
  
  for(let i=0;i<n_asteroids;i++){
    //randomize size    
    let size = possible_sizes[randi(0,possible_sizes.length)]
    var asteroid = make_asteroid('asteroid'+size,
                                 set_safe_distance(rocket.pos,200))
    asteroid.pushOutAll();
  }
  
  var pos_wa = set_safe_distance(rocket.pos,300);
  var pos_wb = set_safe_distance(pos_wa,500);

  // construction of wormhole (entrance) 
  var wormhole_a = make_wormhole('wormhole_a',pos_wa,pos_wb);

  // construction of wormhole (exit) 
  var wormhole_b = make_wormhole('wormhole_b',pos_wb,pos_wa);
  
  // updating wormhole swirling
  onUpdate('swirl',(e)=>{
    e.angle += 1;
  });
  
  // collision between rocket and asteroid
  onCollide('rocket','asteroid_large',(r,a)=>{    
    kill(r);  
  });
  onCollide('rocket','asteroid_medium',(r,a)=>{    
    kill(r);    
  });
  onCollide('rocket','asteroid_small',(r,a)=>{    
    kill(r);   
  });

  // collision between rocket and wormhole
  onCollide('rocket','wormhole_a',(r,w)=>{
    if(r.is_warping==false){      
      r.pos.x = w.pos_the_other.x;
      r.pos.y = w.pos_the_other.y;
      destroy(w)
      console.log(w.pos,w.pos_the_other,r.pos); 
      r.is_warping = true;
    }
    else{
      destroy(w);
      r.is_warping = false;

      var pos_wa = set_safe_distance(rocket.pos,300);
      var pos_wb = set_safe_distance(pos_wa,500);
    
      // construction of wormhole (entrance) 
      var wormhole_a = make_wormhole('wormhole_a',pos_wa,pos_wb);
    
      // construction of wormhole (exit) 
      var wormhole_b = make_wormhole('wormhole_b',pos_wb,pos_wa);
    }
  });
  onCollide('rocket','wormhole_b',(r,w)=>{
    if(r.is_warping==false){      
      r.pos.x = w.pos_the_other.x;
      r.pos.y = w.pos_the_other.y;
      destroy(w)
      console.log(w.pos,w.pos_the_other,r.pos); 
      r.is_warping = true;
    }
    else{
      destroy(w);
      r.is_warping = false;

      var pos_wa = set_safe_distance(rocket.pos,300);
      var pos_wb = set_safe_distance(pos_wa,500);
    
      // construction of wormhole (entrance) 
      var wormhole_a = make_wormhole('wormhole_a',pos_wa,pos_wb);
    
      // construction of wormhole (exit) 
      var wormhole_b = make_wormhole('wormhole_b',pos_wb,pos_wa);  
    }
  });

  // collision between bullet and asteroid
  onCollide('bullet','asteroid_small',(b,a)=>{
    destroy(b);
    destroy(a);
    score += 1;    
  });
  onCollide('bullet','asteroid_medium',(b,a)=>{
    destroy(b);
    destroy(a);
    var asteroid_a = make_asteroid('asteroid_small',a.pos);
    var asteroid_b = make_asteroid('asteroid_small',a.pos);
    asteroid_a.pushOutAll();
    asteroid_b.pushOutAll();
    score += 1;    
  });
  onCollide('bullet','asteroid_large',(b,a)=>{
    destroy(b);
    destroy(a);
    score += 1;
    var asteroid_a = make_asteroid('asteroid_medium',a.pos);
    var asteroid_b = make_asteroid('asteroid_medium',a.pos);
    asteroid_a.pushOutAll();
    asteroid_b.pushOutAll();
  });

  // game over screen
  rocket.on('destroy',()=>{
    add([
     text('GAME OVER',{size:20}),pos(0.5*width(),0.5*height()),layer('score')
    ]);
  });
});

go('main');