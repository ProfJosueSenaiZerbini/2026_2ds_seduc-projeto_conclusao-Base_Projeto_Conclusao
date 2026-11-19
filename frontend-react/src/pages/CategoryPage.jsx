import React from 'react';
import ResenhasPage from './ResenhasPage';

const CategoryPage = ({ categoryName }) => {
  return <ResenhasPage initialCategory={categoryName} />;
};

export default CategoryPage;
