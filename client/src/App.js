import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      title: '',
      content: '',
    }  

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

  sumbit(event) {
    event.preventDefault();
    console.log(`${this.state.title},${this.state.content}`);
    
    axios.post("http://localhost:3000/api/todo",
      {
        title: this.state.title,
        content: this.state.content
      }
    )
    .then((response) => {
      console.log(response);
    })
    .catch((e) => console.error(e));
  }
  
  render() {
    return (
      <div style={{margin:"100px"}}>                  
         <form>
           <p>투두리스트</p>
           <input type="text" name="title" onChange={this.handleChange}/><br/>
           <textarea name="content" onChange={this.handleChange}>
           </textarea> 
           <button onClick={this.sumbit}>전송</button>
         </form>        
      </div>
    );
  }
}

export default App;
