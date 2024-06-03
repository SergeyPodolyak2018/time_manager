import styles from './infobaritems.module.scss';
import { useSelector } from 'react-redux';
import { getCheckedItems } from '../../../../../redux/selectors/filterSelector';
import { getIsUseCustomColors } from '../../../../../redux/selectors/timeLineSelector';
import { getColorByID } from '../../../../../redux/selectors/colorsSelector';
import { SchStateType } from '../../../../../common/constants/schedule';

class Item {
  label: string;
  defaultColor: string;
  type: SchStateType

  constructor(label: string, color: string, type: SchStateType) {
    this.label = label;
    this.defaultColor = color;
    this.type = type
  }
}

const items = [
  new Item('Exception', '#DA3732', SchStateType.EXCEPTION),
  new Item('Day Off', '#A0E094', SchStateType.DAY_OFF),
  new Item('Work', '#0839B4', SchStateType.ACTIVITY),
  new Item('Activity Set', '#FEF051', SchStateType.ACTIVITY_SET),
  new Item('Time Off', '#25A78D', SchStateType.TIME_OFF),
  new Item('Break', '#D0D0D0', SchStateType.BREAK),
  new Item('Meal', '#72D7F5', SchStateType.MEAL),
  new Item('Marked Time', '#EF8650', SchStateType.MARKED_TIME),
];

export const StaticItems = () => {
  const initChecked = useSelector(getCheckedItems);
  const buId = Object.keys(initChecked)?.[0]
  const customColorsTriger = useSelector(getIsUseCustomColors)
  const colorsFromApi = useSelector(getColorByID(Number(buId) || 0));

  return (
    <div className={styles.childContainer}>
      <p className={`${styles.item} ${styles.titleFontStyle}`}> Legend: </p>
      {items.map(item => {
        return (
          <div key={item.label} className={`${styles.item} ${styles.mainFontStyle}`}>
            <img className={styles.rect} style={{ background:
                customColorsTriger && buId && colorsFromApi
                  ? colorsFromApi[SchStateType[item.type] as keyof typeof colorsFromApi]?.color
                    ?  colorsFromApi[SchStateType[item.type] as keyof typeof colorsFromApi]?.color
                    : item.defaultColor
                  : item.defaultColor
            }} />
            {item.label}
          </div>
        );
      })}
    </div>
  );
};
