import React, { useState, useContext, useEffect } from 'react';

import SelectOption from './SelectOption';

import { languageOptions } from '../languages';
import { LanguageContext } from '../Language';


export default function LanguageSelector() {
  const { userLanguage, userLanguageChange } = useContext(LanguageContext);

  // set selected language by calling context method
  const handleLanguageChange = e => userLanguageChange(e);
  // console.log(userLanguage);


  return (
    <SelectOption
    value={userLanguage}
    onValueChange={handleLanguageChange}
    items={languageOptions || ''}
    key={(item)=> item?.id || ''}
  />
  );
};