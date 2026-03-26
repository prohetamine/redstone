import equal from 'fast-deep-equal'

const reactEqual = (a, b) => 
    equal(a, b) ? a : b

export default reactEqual