import React, { useEffect } from 'react';
import styles from './search.module.scss';
import { ReactComponent as Glass } from './MagnifyingGlass.svg';
import useStateRef from 'react-usestateref';
import classnames from 'classnames';

export interface ISearchProps extends React.HTMLProps<HTMLElement> {
  change: (...args: any[]) => void;
  removeSpecialCharacters?: boolean;
  loading?: boolean;
}

const Search = (props: ISearchProps) => {
  const [search, setSearch, searchRef] = useStateRef('');

  useEffect(() => {
    props.change(searchRef.current);
  }, [searchRef.current]);

  const changeQuery = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (props.removeSpecialCharacters) {
      const newString = e.target.value.replace(/[.*+?^${}()|[\]\\]/g, '');
      setSearch(newString);
    } else {
      setSearch(e.target.value);
    }
  };

  return (
    <div
      className={classnames(styles.input_wrapper, {
        [styles.input_wrapper__loading]: props.loading && search.length,
      })}
    >
      {!props.loading ? <Glass /> : <div className={styles.input_wrapper_iconHolder}></div>}

      <input
        className={styles.input}
        type="text"
        name="search"
        autoComplete="on"
        value={search}
        onChange={changeQuery}
        placeholder={'search'}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
    </div>
  );
};

export default Search;
