import { Disclosure, DisclosureButton, DisclosurePanel} from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
// import { useNavigate } from "react-router-dom";
// import { getAuth, signOut } from 'firebase/auth';
import { faLeaf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const navigation = [
  { name: 'Home', href: '/home', current: true },
  { name: 'Plant Search', href: '/plantsearch', current: false},
  { name: 'Profile', href: '/profile', current: false},
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function NavBar() {
    // const auth = getAuth();
    // const navigate = useNavigate();

    // const signOutUser = () => {
    //     signOut(auth)
    //         .then(() => {
    //             navigate('./')
    //         })
    //         .catch((error) => {
    //             console.error("Error signing out");
    //         });
    // };
  return (
    <Disclosure as="nav" className="bg-inherit">
      <div className=''>
        {/* Header Section */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faLeaf} alt="Plant icon" className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">WaterWise</h1>
                  <p className="text-sm text-gray-600">Smart watering assistant</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Let's keep your plants happy today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="relative flex h-12 items-center justify-between">
              {/* Mobile menu button */}
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  <Bars3Icon aria-hidden="true" className="block h-6 w-6 group-data-[open]:hidden" />
                  <XMarkIcon aria-hidden="true" className="hidden h-6 w-6 group-data-[open]:block" />
                </DisclosureButton>
              </div>

              {/* Desktop navigation */}
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="hidden sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        aria-current={item.current ? 'page' : undefined}
                        className={classNames(
                          item.current 
                            ? 'bg-green-100 text-green-900' 
                            : 'text-gray-600 hover:bg-green-50 hover:text-green-700',
                          'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200',
                        )}
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right side buttons */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {/* Notification button */}
                <button
                  type="button"
                  className="relative rounded-full bg-white p-1 text-gray-600 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <BellIcon aria-hidden="true" className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as="a"
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              className={classNames(
                item.current 
                  ? 'bg-green-100 text-green-900' 
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-700',
                'block rounded-md px-3 py-2 text-base font-medium',
              )}
            >
              {item.name}
            </DisclosureButton>
          ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}