import React, { useState } from 'react';
import styles from './input.module.scss';
import TagsInput from 'react-tagsinput';
import InputMask from 'react-input-mask';
import mainStyles from '../input.module.scss';

export interface IInputTagProps extends React.HTMLProps<HTMLElement> {
  onChange: (e: any) => void;
  onClickTagsDropdown: () => void;
  isTagsDropdownOpen?: boolean;
  value?: string;
  searchPlaceholderValue?: string;
  startSearch: (value: string) => void;
  setHighlightedValue: (value: string) => void;
  words: string[];
  setWords: (words: string[]) => void;
  isConventionalSearch: boolean;
}
const defaultMask = [/C|[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/];
const maskWithC = [/C/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/, /[0-9]/];

const InputTagSearch = (props: IInputTagProps) => {
  const {
    value,
    onChange,
    searchPlaceholderValue,
    onClickTagsDropdown,
    isTagsDropdownOpen,
    setHighlightedValue,
    startSearch,
    words,
    setWords,
    isConventionalSearch
  } = props;
  const [maskState, setMaskState] = useState(defaultMask);

  const inputProps = { className: styles.tagsinputInput, placeholder: searchPlaceholderValue };
  const tagProps = { className: styles.tagsinputTag, classNameRemove: styles.tagsinputRemove };

  const beforeMaskedStateChange = ({ nextState, previousState, currentState }: any) => {
    let { value } = nextState;
    const { enteredString } = nextState;
    if (currentState?.value?.length < previousState?.value?.length) {
      /^((C0{7})|((?!C)\d{7}))$/.test(previousState.value)
        ? (value = '0' + currentState.value)
        : (value = value[0] + '0' + currentState.value.slice(1));
    }
    if (nextState.selection.start === 8 && /^\d+$/.test(value)) {
      value = value.slice(1);
    } else if (enteredString && /^\d+$/.test(enteredString)) {
      /^\d+$/.test(value)
        ? (value = value.slice(1) + enteredString)
        : (value = value[0] + value.slice(2) + enteredString);
    } else if (enteredString && /^C+$/.test(enteredString)) {
      value = enteredString + value.slice(1);
    }
    value === '00000000' ? (value = value.slice(1)) : null;
    return {
      ...nextState,
      value,
    };
  };

  const changeValue = (value?: string) => {
    if (value) {
      const searchValue = words.join(',');
      if (value === searchValue || value < searchValue) return '';
      return String(value).split(',').pop();
    }
    return value
  }

  const renderInput = (props: any) => {
    const { onChange, value, ...other } = props;

    return (
      <>
        { isConventionalSearch ? (<InputMask
          id="search-input"
          onKeyUp={e => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          onClick={e => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          onFocus={e => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
          maskPlaceholder="0"
          mask={maskState}
          onChange={e => {
            /^C\d+$/.test(e.currentTarget.value) ? setMaskState(maskWithC) : setMaskState(defaultMask);
            e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length);
            /^0{7,8}$/.test(e.currentTarget.value) ? (e.currentTarget.value =  words.length ? `${words.join(',')},0000000`: '') : null;
            return onChange(e);
          }}
          alwaysShowMask={false}
          value={changeValue(value)}
          beforeMaskedStateChange={beforeMaskedStateChange}
          {...other}
        />) :  (<input
            id="search-input"
            className={mainStyles.input}
            autoComplete={'off'}
            onChange={e => {
              return onChange(e)
            }}
            value={changeValue(value)}
            placeholder={searchPlaceholderValue}
            {...other}
          />
        )}
      </>
    );
  };

  const handleInputChange = (value: string) => {
    let searchValue = value;
    if (words.length && value) {
      searchValue = `${words.join(',')},${value}`
      onChange(searchValue);
    } else {
      onChange(value);
    }
  };

  const defaultRenderLayout = (tagElements: any, inputElement: any) => {
    return (
      <div className={tagElements.length ? styles.renderLayout + ' ' + styles.withTagButton : styles.renderLayout}>
        {tagElements.length ? (
          <button
            className={isTagsDropdownOpen ? styles.tagsinputBtn2 : styles.tagsinputBtn}
            datatype={'settingsBtn'}
            id={'searchBtn'}
            onClick={onClickTagsDropdown}
          >
            {tagElements.length}
          </button>
        ) : null}
        {inputElement}
        {isTagsDropdownOpen && tagElements.length && <div className={styles.tagsinputDropdown}>{tagElements}</div>}
      </div>
    );
  };

  return (
    <TagsInput
      value={words}
      className={styles.tagsinput}
      focusedClassName={styles.tagsinputFocused}
      tagProps={tagProps}
      renderInput={renderInput}
      inputValue={value}
      onChangeInput={handleInputChange}
      renderLayout={defaultRenderLayout}
      addOnPaste={true}
      addKeys={[13, 188, 9]}
      pasteSplit={(data: string) => {
        let separator = ',';
        if (data.includes('\n')) separator = '\n';
        return data.split(separator).map(d => d.trim());
      }}
      onChange={(newWords: string[]) => {
        if (newWords) {
          if (newWords.length) {
            // @ts-ignore
            const newValue = newWords?.pop().split(',').pop()
            if (newValue && (!isConventionalSearch || /^(?!0{7})C?\d{7}$/.test(newValue))) newWords.push(newValue)
          }
          newWords = [...new Set(newWords)];
          !newWords.length && isTagsDropdownOpen ? onClickTagsDropdown() : null;
          setWords(newWords);
          const searchValue = newWords.join(',');
          setHighlightedValue(searchValue);
          if (newWords.length) {
            startSearch(searchValue);
          } else {
            onChange(searchValue);
          }
        }
      }}
      inputProps={inputProps}
    />
  );
};

export default InputTagSearch;
