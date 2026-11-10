/**
 * Area lists used to guess the delivery zone from the buyer's থানা / address.
 * All entries are lowercase. Add spellings here if a buyer's area isn't detected.
 */

/** Dhaka city thanas and well-known neighbourhoods → Inside Dhaka (Tk 80). */
export const INSIDE_DHAKA_AREAS = [
  'adabor', 'agargaon', 'airport', 'azimpur', 'badda', 'banani', 'banasree', 'bangshal', 'baridhara',
  'bashundhara', 'bhasantek', 'bhashantek', 'bhatara', 'vatara', 'bimanbandar', 'cantonment',
  'chawkbazar', 'chakbazar', 'chackbazar', 'dakshinkhan', 'dakkhinkhan', 'darus salam', 'darussalam',
  'demra', 'dhanmondi', 'dhanmandi', 'elephant road', 'farmgate', 'gabtoli', 'gendaria', 'gulshan',
  'hatirjheel', 'hazaribagh', 'jatrabari', 'jattrabari', 'kadamtali', 'kafrul', 'kalabagan',
  'kamrangirchar', 'kawran bazar', 'karwan bazar', 'khilgaon', 'khilgao', 'khilkhet', 'kotwali',
  'kuril', 'lalbagh', 'lalbag', 'lalmatia', 'malibagh', 'merul', 'mirpur', 'moghbazar', 'mogbazar',
  'mohakhali', 'mohammadpur', 'mohammedpur', 'muhammadpur', 'motijheel', 'mouchak', 'mugda', 'mugdha',
  'new market', 'nikunja', 'pallabi', 'paltan', 'puran dhaka', 'old dhaka', 'ramna', 'rampura',
  'rayer bazar', 'rupnagar', 'sabujbagh', 'sadarghat', 'shah ali', 'shahbagh', 'shahjahanpur',
  'shantinagar', 'sher-e-bangla nagar', 'sher e bangla nagar', 'shewrapara', 'shyamoli', 'shyampur',
  'sutrapur', 'tejgaon', 'tejgaon industrial', 'turag', 'uttara', 'uttarkhan', 'wari', 'kazipara',
  'basabo', 'bashabo', 'mohanagar', 'aftabnagar', 'jigatola', 'zigatola', 'kathalbagan', 'segunbagicha',
  'green road', 'panthapath', 'nilkhet', 'rajarbagh', 'tikatuli', 'gopibagh', 'dholaipar', 'sayedabad',
  'mirpur dohs', 'mohakhali dohs', 'banani dohs', 'baridhara dohs', 'ibrahimpur', 'beraid', 'satarkul',
];

/**
 * Places that mean Outside Dhaka (Tk 120). These win over the list above —
 * e.g. "Kotwali, Chattogram" or "Savar, Dhaka" are outside.
 */
export const OUTSIDE_DHAKA_AREAS = [
  'savar', 'ashulia', 'keraniganj', 'dhamrai', 'dohar', 'nawabganj', 'tongi', 'gazipur', 'narayanganj',
  'fatullah', 'siddhirganj', 'rupganj', 'sonargaon', 'munshiganj', 'manikganj', 'narsingdi',
  'chittagong', 'chattogram', 'ctg', 'cox', 'coxs bazar', "cox's bazar", 'feni', 'noakhali', 'lakshmipur',
  'comilla', 'cumilla', 'chandpur', 'brahmanbaria', 'sylhet', 'moulvibazar', 'habiganj', 'sunamganj',
  'khulna', 'jessore', 'jashore', 'satkhira', 'bagerhat', 'kushtia', 'jhenaidah', 'magura', 'narail',
  'chuadanga', 'meherpur', 'rajshahi', 'bogura', 'bogra', 'pabna', 'sirajganj', 'natore', 'naogaon',
  'joypurhat', 'chapainawabganj', 'rangpur', 'dinajpur', 'kurigram', 'gaibandha', 'nilphamari',
  'lalmonirhat', 'thakurgaon', 'panchagarh', 'barishal', 'barisal', 'patuakhali', 'bhola', 'pirojpur',
  'jhalokati', 'barguna', 'mymensingh', 'jamalpur', 'sherpur', 'netrokona', 'kishoreganj', 'tangail',
  'faridpur', 'gopalganj', 'madaripur', 'shariatpur', 'rajbari', 'rangamati', 'khagrachari',
  'bandarban',
];
