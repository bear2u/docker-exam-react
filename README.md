# React,MongoDB,Express,Nginx 도커 개발 환경 구성하기

이번 시간에는 대중적으로 많이 쓰이는 환경을 도커로 하나씩 구축해볼 예정이다. 

구성 스택은 다음과 같다. 

1. Client : React
2. Api Server : Node Express
3. DB : Mongo
4. Server : Nginx

## Root

우선 환경을 구성한다. 기본적으로 3개의 폴더와 `docker-compose.yaml` 파일로 구성된다. 

```cmd
- client
	- ...sources
	- Dockerfile.dev
- nginx
	- default.conf
	- Dockerfile.dev	
- server
	- ...sources
	- Dockerfile.dev
- docker-compose.yaml	
```

## Client

`create-react-app` 을 이용해서 구성한다. 

```cmake
- ./client

# create-react-app client
```

`dockerfile.dev` 파일을 만들어 준다.

```
# 노드가 담긴 alpine 이미지 가져오기
FROM node:10.15-alpine

//작업할 디렉토리 설정
WORKDIR "/app"

//npm install을 캐싱하기 위해 package.json만 따로 카피
COPY ./package.json ./
RUN npm install
 
// 소스 복사 
COPY . .

//client 소스 실행
CMD ["npm","run","start"]
```

## Server

`express generator`를 이용해서 만들 예정이다.

```cmd
npm install -g express-generator

express server
```

`package.json`에는 실시간 개발환경을 위해서 `nodemon`을 추가해주자. 

```
  "scripts": {
    "dev": "nodemon ./bin/www",
    "start": "node ./bin/www"
  },
```

서버쪽에도 `dockerfile.dev`을 만들어보자

```
FROM node:10.15-alpine

WORKDIR "/app"

COPY ./package.json ./

RUN npm install -g nodemon \
 && npm install
 
COPY . .

CMD ["npm","run","dev"]
```

## Nginx

프록시 서버로 동작될 예정이다. 

client와 server 부분을 따로 프록시로 관리한다. 

server는 / 로 들어오는 요청을 `/api` 로 바꿔준다. 

파일 두개를 생성해주자

- `default.conf`

```
# nginx/default.conf

upstream client {
    server client:3000;
}

upstream server {
    server server:3050;
}

server {
    listen 80;

    location / {        
        proxy_pass http://client;
    }

    location /sockjs-node {
        proxy_pass http://client;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }

    location /api {
        rewrite /api/(.*) /$1 break;
        proxy_pass http://server;
    }
}
```

- `Dockerfile.dev`

```
# nginx/Dockerfile.dev

FROM nginx
COPY ./default.conf /etc/nginx/conf.d/default.conf
```



## Docker-compose

이제 기본 생성된 파일들을 묶어주고 간편하게 한번에 올릴 수 있게 하자. 

- `docker-compose.yaml`

```yaml
version: "3"
services:
  client:                 
    build:
      dockerfile: Dockerfile.dev
      context: ./client    
    volumes:
      - ./client/:/app      
      - /app/node_modules  
    networks:
      - backend           
  server:                          
    build:
      dockerfile: Dockerfile.dev
      context: ./server    
    volumes:
      - ./server/:/app      
      - /app/node_modules      
    environment:
      - NODE_PATH=src
      - PORT=3050
      - DB_HOST=mongo
      - DB=test
      - REDIS_HOST=redis
      - REDIS_PORT=6379      
    networks:
      - backend  
    depends_on:
      - mongo
      - redis 
    ports:
      - "5000:3050"   
  redis:
    container_name: redis
    image: redis
    environment:
      - ALLOW_EMPTY_PASSWORD=yes
    networks:
      - backend 
    volumes:
      - data:/data/redis   
    ports:
      - "6379:6379"
    restart: always    
  mongo:
    container_name: mongo
    image: mongo
    volumes:
      - data:/data/db
    ports:
      - "27017:27017" 
    networks:
      - backend

  nginx:
    restart: always
    build:
      dockerfile: Dockerfile.dev
      context: ./nginx 
    ports:
      - '3000:80' 
    networks:
      - backend
    

networks: 
  backend:
    driver: bridge

volumes:
  data:
    driver: local  
```

위 내용을 잠깐 설명하자면 기본적으로 서비스는 5개를 실행하고 있다. 

- client
- server
- mongo
- redis
- nginx

이 많은 서비스를 저 파일 하나로 묶어서 배포를 할수 있다. 멋지다. 

자 그럼 실행해서 잘되는 지 체크 해보자. 

## 실행

```
# --build는 내부 Dockerfile 이 변경시 다시 컴파일 해준다. 
docker-compose up --build or docker-compose up

docker-compose stop or docker-compose down
```

일단 이상태로는 기본 환경만 올라간 상태라서 뭘 할수 있는 건 아니다. 

소스를 좀 더 추가해서 연동을 해보자. 



## Client

- App.js
  - `npm install axios`

```javascript
import React, { Component } from "react";
import axios from "axios";
import Items from './Items';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "",
      content: "",
      change: false
    };

    this.handleChange = this.handleChange.bind(this);
    this.sumbit = this.sumbit.bind(this);
  }

  handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    console.log(name, value);

    this.setState({
      [name]: value
    });
  }

  async sumbit(event){
    event.preventDefault();
    console.log(`${this.state.title},${this.state.content}`);

    await axios
      .post("/api/todos", {
        title: this.state.title,
        content: this.state.content
      })
      .then((result) => {
        this.setState({
          change : true
        });
      })
  }

  render() {
    return (
      <div style={{ margin: "100px" }}>
        <div>
          <form>
            <p>투두리스트</p>
            <input type="text" name="title" onChange={this.handleChange} />
            <br />
            <textarea name="content" onChange={this.handleChange} />
            <button onClick={this.sumbit}>전송</button>
          </form>
        </div>
        <Items change={this.state.change}/>
      </div>
    );
  }
}

export default App;
  
```

```
await axios
      .post("/api/todos", {
        title: this.state.title,
        content: this.state.content
      })
```

여기에서 `/api`를 통해서 바로 도커내 `api`서버로 접근을 할 수 있다. 

그리고 추가된 리스트는 Items.js 컴포넌트를 만들어서 관리한다. 

```javascript
import React, { Component } from "react";
import axios from "axios";

class Items extends Component {
  constructor(props) {
    super(props);
    this.state = {
        Todos: []
    }
  }

  componentWillReceiveProps(props) {
      console.log(props);
      this.renderTodos();
  }

  componentDidMount() {
      this.renderTodos();
  }

  async renderTodos() {

    try {
        let todos = await axios.get("/api/todos");

        this.setState({
            Todos: todos.data.map(todo => {
                console.log(this.getItem(todo));
                return this.getItem(todo);
            })
        });
    } catch (err) {
        console.log(err);
    }
  }

  getItem(todo) {
    //   console.log(todo);
    return (
      <div key={todo._id}>
        <div style={{ padding: "10px", border:"1px solid red" }}>          
          <div>{todo.title}</div>
          <div>{todo.content}</div>
          <div>{todo.regdate}</div>
        </div>
      </div>
    );
  }

  render() {
    return <div>{this.state.Todos}</div>;
  }
}

export default Items;

```

결과 화면

![image-20190119144313239](image-20190119144313239-7876593.png)

아주 심플하지만 작동은 잘 된다. 서버쪽 소스도 업데이트를 해야 잘 나오는 것 명심하자. 

## Server

Server에서 추가 사항은 몽고 디비와 연동해서 데이터 주고 받는 부분이다. 

- app.js
  - `npm install mongoose`

```javascript
  var createError = require('http-errors');
  var express = require('express');
  var path = require('path');
  var cookieParser = require('cookie-parser');
  var logger = require('morgan');
  var cors = require('cors');
  var mongoose = require('mongoose');
  
  var db = mongoose.connection;
  db.on('error', console.error);
  db.once('open', function(){    
      console.log("Connected to mongod server");
  });
  
  mongoose.connect('mongodb://mongo/todo');
  
  var indexRouter = require('./routes/index');
  var usersRouter = require('./routes/users');
  var todoRouter = require('./routes/todo');
  
  var app = express();
  
  //Cors 설정
  app.use(cors());
  
  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');
  
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  
  app.use('/', indexRouter);
  app.use('/users', usersRouter);
  app.use('/todos', todoRouter);
  
  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });
  
  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });
  
  module.exports = app;
  
```

- todo.js

```javascript
var express = require('express');
var router = express.Router();

var Todo = require('../models/todo');

/* GET home page. */
router.get('/', function(req, res, next) {
  return Todo.find({}).sort({regdate: -1}).then((todos) => res.send(todos));
});

router.post('/', function(req, res, next) {
  const todo = Todo();
  const title = req.body.title;
  const content = req.body.content;

  todo.title = title;
  todo.content = content;

  return todo.save().then((todo) => res.send(todo)).catch((error) => res.status(500).send({error}));
});

module.exports = router;

```

- model/todo.js

```javascript
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var todoSchema = new Schema({
    content: String,
    title: String,
    isdone : Boolean,
    regdate: { type: Date, default: Date.now  }
});

module.exports = mongoose.model('todo', todoSchema);
```

## 마무리

다시 docker-compose up --build로 통해서 올려보면 작동이 잘 되는 걸 볼수 있다. 

이상으로 GDG 부산에서 진행하는 `도커 & 쿠버네티스` 스터디 내용이었습니다. 

참가해주셔서 감사합니다. 
