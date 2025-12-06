import { REPO_URL } from '@constants';
import GithubIcon from './github-icon.component';
const Header = () => {
  return (
    <header className="flex items-center justify-between text-white p-4">
      <a href="https://textmatchcut.github.io">
        <h1 className="text-2xl">TextMatchCut</h1>
      </a>
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
        <GithubIcon className="w-6 h-6 cursor-pointer" />
      </a>
    </header>
  );
};

export default Header;
