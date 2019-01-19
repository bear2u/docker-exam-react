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
