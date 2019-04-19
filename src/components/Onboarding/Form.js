import React, { Component } from 'react';

export class Form extends Component {
  constructor(props) {
    super(props);
    this.childRefs = [];
    this.state = {};
  }

  handleInput = fieldName => text => {
    this.setState({ [fieldName]: text });
  };

  refCollector = ref => this.childRefs.push(ref);

  handleSubmit = index => () => {
    const { formSubmission } = this.props;

    if (index < this.childRefs.length - 1 && this.childRefs[index + 1].focus) {
      this.childRefs[index + 1].focus();
    } else {
      formSubmission(this.state);
    }
  };

  render() {
    const childs = [];
    const { children } = this.props;

    React.Children.map(children, (child, index) => {
      if (!child) return;

      childs.push(
        React.cloneElement(child, {
          ref: this.refCollector,
          onSubmitEditing: this.handleSubmit(index),
          onChangeText: this.handleInput(index),
          returnKeyType: index < children.length - 1 ? 'next' : 'done'
        })
      );
    });

    return childs;
  }
}

export default Form;
