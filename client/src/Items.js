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
