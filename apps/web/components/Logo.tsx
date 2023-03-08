const Logo = ({ className }: { className: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 30 26"
      className={className}
    >
      <g>
        <path
          fill="#F05924"
          d="m18.3208 18.0362.6098.9534c-1.043 2.189-2.8003 3.955-4.9804 5.0042-1.5852.7612-3.2919 1.2337-5.04144 1.3953-.71567.0756-1.43522.1127-2.15543.1114H0V6.02588h5.11874V21.0561h1.81513c.66176.0032 1.32287-.0554 1.97359-.174 2.28144-.4249 4.02574-1.6331 5.02654-3.607.6176-1.2167 1.2579-2.4177 1.2579-4.2144l-.0013-.0964 3.1302 5.0719Z"
        />
        <path
          className="fill-[#0E1419] dark:fill-[#fff]"
          fill="#0E1419"
          d="M30 0v25.5h-5.0824l-5.3005-8.2978-4.0628-6.7174c-.0195-.0359-.037-.0724-.0578-.1128-.5137-.89992-1.082-1.76795-1.7015-2.59818-.504-.67448-1.1008-1.27337-1.7736-1.77842l-.3409-.23916c-.7806-.50766-1.6482-.86478-2.55938-1.05376-.06949-.01564-.14028-.02933-.21366-.04301-.50785-.09645-1.02284-.1538-1.53913-.17139-.14287-.00456-.28834-.00782-.43381-.00782H0V0h6.75268c.20781 0 .41238.00325837.61565.00912343C7.89436.0247636 8.4074.0593023 8.90746.114043 13.169.577383 16.4174 2.44834 18.3176 5.46429l.0058.01107.5806 1.04399 6.0506 10.89335V0H30Z"
        />
      </g>
      <defs>
        <clipPath id="a">
          <path fill="#fff" d="M0 0h30v25.5H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default Logo;
