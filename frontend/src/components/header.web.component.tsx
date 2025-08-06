import GithubIcon from './github-icon.component';
const Header = () => {
  return (
    <header className="flex items-center justify-between text-white p-4">
      <h1 className="text-2xl">Text Match Cut</h1>
      <GithubIcon className="w-6 h-6 cursor-pointer" />
    </header>
  );
};

export default Header;
