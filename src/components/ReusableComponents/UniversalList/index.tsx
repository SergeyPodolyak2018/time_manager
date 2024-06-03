import React, { useCallback, useState } from 'react';

import styles from './universalList.module.scss';

export interface IUniversalList {
  list: string[];
  clickOn: (name: string) => void;
  active: string;
  onScrolledToEnd?: () => void;
  onScrolledToStart?: () => void;
  containerStyle?: any;
}

// FIXME: handle prepending elements breaks ux (scrolling to top jumps instantly)
const handleScroll =
  (onScrolledToStart: IUniversalList['onScrolledToStart'], onScrolledToEnd: IUniversalList['onScrolledToEnd']) =>
  (e: any) => {
    if (!onScrolledToStart && !onScrolledToEnd) return;
    // detect if scrolled to start
    const top = e.target.scrollTop === 0;

    if (top && onScrolledToStart) {
      onScrolledToStart();
      return;
    }

    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom && onScrolledToEnd) {
      onScrolledToEnd();
    }
  };

const UniversalList = (props: IUniversalList) => {
  const [listState, setListState] = useState(false);
  const { list, active } = props;
  // reference to scrollable element
  const scrollableElement = React.useRef<HTMLDivElement>(null);

  const clickOn = (name: string) => {
    props.clickOn(name);
  };

  const scrollToActive = useCallback(() => {
    const activeElement = document.querySelector(`.${styles.active}`) as HTMLElement;
    if (!activeElement) return;
    const scrollable = scrollableElement.current;
    if (!scrollable) return;
    scrollable.scrollTop = activeElement.offsetTop - scrollable.clientHeight / 2;
  }, [listState]);

  React.useEffect(() => {
    scrollToActive();
  }, [listState]);

  return (
    <div
      className={styles.container}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        setListState(!listState);
      }}
    >
      <div className={styles.default}>{active}</div>
      <div className={`${styles.arrow} ${listState ? styles.rotate : ''}`}></div>
      {listState ? (
        <div
          className={styles.tzContainer}
          style={props.containerStyle}
          onScroll={handleScroll(props.onScrolledToStart, props.onScrolledToEnd)}
          ref={scrollableElement}
        >
          {list.map((element, index) => {
            return (
              <div className={`${styles.tzElementContainer} ${element === active ? styles.active : ''}`} key={index}>
                <div
                  className={styles.tzElement}
                  onClick={() => {
                    clickOn(element);
                  }}
                >
                  {element}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default UniversalList;
