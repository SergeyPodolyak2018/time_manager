// @index('./*.{png,jpg,jpeg,svg,gif}', (f, _) => `import { ReactComponent as ${_.pascalCase(f.name)} } from '${f.path}${f.ext}'`)
import { ReactComponent as AllStatuses } from './allStatuses.svg';
import { ReactComponent as BiddingClosed } from './biddingClosed.svg';
import { ReactComponent as BiddingOpen } from './biddingOpen.svg';
import { ReactComponent as BiddingPending } from './biddingPending.svg';
import { ReactComponent as Imported } from './imported.svg';
import { ReactComponent as New } from './new.svg';
import { ReactComponent as ProfilesAssigned } from './profilesAssigned.svg';
import { ReactComponent as Published } from './published.svg';
import { ReactComponent as Scheduled } from './scheduled.svg';
import { ReactComponent as SchWithProfiles } from './schWithProfiles.svg';

// @endindex
export {
  // @index('./*', (f, _) => `${_.pascalCase(f.name)},`)
  AllStatuses,
  BiddingClosed,
  BiddingOpen,
  BiddingPending,
  Imported,
  New,
  ProfilesAssigned,
  Published,
  Scheduled,
  SchWithProfiles,
  // @endindex
};
