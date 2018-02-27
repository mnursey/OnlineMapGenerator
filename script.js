/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function dropdownFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}
function download() {
    var dt = canvas.toDataURL();
    this.href = dt; //this may not work in the future..
}
document.getElementById("downloadbtn").addEventListener('click', download, false);

/*Map Generation*/
var MapChunks = [];
var DrawQue = [];
var types = ['mountians', 'woods', 'grass'];
var mountianImages = [];
var treeImages = [];
var grassImages = [];
const CHUNKSIZE = 256;

function GenerateMap(){
  mountianImages = [];
  treeImages = [];
  grassImages = [];
  MapChunks = [];
  DrawQue = [];

  var mountian0 = new Image();
  var mountian1 = new Image();
  var hill0 = new Image();
  var hill1 = new Image();
  var tree0 = new Image();
  var tree1 = new Image();
  var grass0 = new Image();
  var grass1 = new Image();
  var grass2 = new Image();

  mountianImages.push(mountian0);
  mountianImages.push(mountian1);
  mountianImages.push(hill0);
  mountianImages.push(hill1);
  treeImages.push(tree0);
  treeImages.push(tree1);
  grassImages.push(grass0);
  grassImages.push(grass1);
  grassImages.push(grass2);

  camera.Setup();
  camera.ResizeCanvas();
    treeImages[1].onload = function(){
    GenerateChunks(6, 4);
    DrawMap();
  };
  mountian0.src = 'mountain0.png';
  mountian1.src = 'mountain1.png';
  hill0.src = 'hill0.png';
  hill1.src = 'hill1.png';
  grass0.src = 'grass0.png';
  grass1.src = 'grass1.png';
  grass2.src = 'grass2.png';
  tree0.src = 'tree0.png';
  tree1.src = 'tree1.png';

  camera.DrawText(0, 15, 'Loading...','White', '100', 'Amita');
}

function DisplayNewMap()
{
  MapChunks = [];
  DrawQue = [];
  GenerateChunks(6, 4);
  DrawMap();
}

var camera = {
  position : new Vector(0,0),
  canvas : document.getElementById("map"),

  Setup : function()
  {
    this.context = this.canvas.getContext("2d");
    this.canvas.width = 300;
    this.canvas.height = 300;
    this.ClearScene();
  },

  DrawLine : function(xStart, yStart, xEnd, yEnd,colour)
  {
    var ctx = this.context;
    ctx.beginPath();
    ctx.strokeStyle= colour;
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd,yEnd);
    ctx.stroke();
  },

  DrawRectangle : function(x, y, width, height, rotation, colour)
  {
    var ctx = this.context;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180.0);
    ctx.fillStyle = colour;
    ctx.fillRect(width / -2, height / -2, width, height);
    ctx.restore();
  },

  DrawCircle : function(x, y, radius, colour)
  {
    var ctx = this.context;
    ctx.beginPath();
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.arc(x, y, radius / 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
  },

  DrawText : function(x, y, msg, colour, size, font)
  {
	   var ctx = this.context;
	   ctx.font = size + " " + font;
	   ctx.fillStyle = colour;
	   ctx.fillText(msg, x, y);
  },

  DrawImage : function(x, y, image, width, height)
  {
    var ctx = this.context;
  	ctx.drawImage(image, x, y, width, height);
  },

  ClearScene : function()
  {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  FillScene : function(colour)
  {
    console.log('Fill scene');
    camera.DrawRectangle(0 + this.canvas.width / 2, 0 + this.canvas.height / 2, this.canvas.width, this.canvas.height, 0, colour);
  },

  ResizeCanvas: function()
  {
    var canvas = document.getElementById("map");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
	  windowHeight = canvas.height;
	  windowWidth = canvas.width;
    //Add in auto redrawing...
  },

  LookAt: function(x, y)
  {
    camera.position.x = x - windowWidth / 2;
    camera.position.y = y - windowHeight / 2;
  },

  Translate: function(x ,y)
  {
    camera.position.x = x;
    camera.position.y = y;
  }
}

function GenerateChunks(width, height)
{
  for(var x = 0; x < width; x++)
  {
    for(var y = 0; y < height; y++)
    {
      //console.log('Generating new Chunk');
      var c = new Chunk(x, y, types[GetRndInteger(0, types.length)]);
      c.GenerateObjects()
      MapChunks.push(c);
    }
  }
}

function DrawMap()
{
  camera.ClearScene();
  camera.FillScene('#e0dcaf');
  DrawQue = [];
  for(var i = 0; i < MapChunks.length; i++)
  {
    //console.log('Drawing Chunk');
    MapChunks[i].QueMapObjects();
  }
  DrawQue.sort(CompareDrawPrecedenceMapObjects);
  for(var i = 0; i < DrawQue.length; i++)
  {
    //console.log('Draw Que');
    DrawQue[i].Draw();
  }
}

function MapObject(x, y, type, chunk)
{
  this.pos = new Vector(x, y);
  this.type = type;
  this.parentChunk = chunk;
}

MapObject.prototype.Draw = function()
{
  var im = null;
  switch(this.type)
  {
    case 'mountians':
      im = mountianImages[GetRndInteger(0, mountianImages.length)];
      break;
    case 'woods':
      im = treeImages[GetRndInteger(0, treeImages.length)];
      break;
    case 'grass':
      im = grassImages[GetRndInteger(0, grassImages.length)];
      break;
    default:
      im = new Image();
  }
  camera.DrawImage(this.pos.x + this.parentChunk.pos.x * CHUNKSIZE - camera.position.x, this.pos.y + this.parentChunk.pos.y * CHUNKSIZE - camera.position.y, im, 128, 128);
}

function Chunk(x, y, type)
{
  this.pos = new Vector(x, y);
  this.type = type;
  this.chunkObjects = []
}

Chunk.prototype.GenerateObjects = function()
{
  var failCounter = 100;
  var objectCount = 0;
  var objectMinDistance = 0;
  var objectClusterMax = 0;
  var clusterSpread = 0;
  switch(this.type)
  {
    case 'mountians':
      objectCount = 64;
      objectMinDistance = 30;
      break;
    case 'woods':
      objectCount = 700;
      objectMinDistance = 4;
      objectClusterMax = 32;
      clusterSpread = CHUNKSIZE;
      break;
    case 'grass':
      objectCount = 32;
      objectMinDistance = 20;
      objectClusterMax = 3;
      clusterSpread = 30;
      break;
    default:
      objectCount = 0;
      objectMinDistance = 0;
  }
  while(this.chunkObjects.length < objectCount && failCounter > 0)
  {
    //console.log('Adding object to chunk');
    mo = new MapObject(GetRndInteger(0, CHUNKSIZE),GetRndInteger(0, CHUNKSIZE), this.type, this);
    var add = true;
    for(var i = 0; i < this.chunkObjects.length; i++)
    {
      var dis = Math.sqrt(Math.pow(mo.pos.x - this.chunkObjects[i].pos.x,2) + Math.pow(mo.pos.y - this.chunkObjects[i].pos.y, 2));
      if(dis < objectMinDistance)
        add = false;
    }
    if(add)
    {
      this.chunkObjects.push(mo);
      for(var n = GetRndInteger(0, objectClusterMax); n < objectClusterMax; n++)
      {
        var so = new MapObject(mo.pos.x + GetRndInteger(0, clusterSpread) - clusterSpread / 2, mo.pos.y + GetRndInteger(0, clusterSpread) - clusterSpread / 2, this.type, this);
        this.chunkObjects.push(so);
      }
    }
    else
    {
      failCounter--;
    }
  }
}

Chunk.prototype.QueMapObjects = function() {
  for(var i = 0; i < this.chunkObjects.length; i++)
  {
    DrawQue.push(this.chunkObjects[i]);
  }
}

function Vector(x, y)
{
	this.x = x;
	this.y = y;
}

function GetRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

function CompareDrawPrecedenceMapObjects(a, b)
{
  if(a.pos.y + CHUNKSIZE * a.parentChunk.pos.y > b.pos.y + CHUNKSIZE * b.parentChunk.pos.y)
  {
    return 1;
  }

  if(a.pos.y + CHUNKSIZE * a.parentChunk.pos.y < b.pos.y + CHUNKSIZE * b.parentChunk.pos.y)
  {
    return -1;
  }

  return 0;
}
