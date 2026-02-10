module SecureOnlineBanking

/* 
 * --------------------------------------------------------------------------------
 * Signatures (Static Structure)
 * --------------------------------------------------------------------------------
 */

// Helper: Ordering module for trace
open util/ordering[SystemState]

// Basic atoms
sig Password {}
sig Secret {} // MFA Secret
sig RecoveryCode {} 
sig Device {}

// Enumerations for boolean states
enum Bool { True, False }

// Authentication Status
enum AuthStatus { 
    Unauthenticated, 
    PendingMFA, 
    Authenticated 
}

// User definition (Static Configuration)
sig User {
    password: one Password,
    mfaSecret: lone Secret,         // Present if MFA is configured
    recoveryCodes: set RecoveryCode,
    trustedDevices: set Device,
    mfaEnabled: one Bool            // Static configuration for this analysis
}

/* 
 * --------------------------------------------------------------------------------
 * Dynamic State (Time-based trace)
 * --------------------------------------------------------------------------------
 */

// The global state of the system at each time step
sig SystemState {
    auth: User -> AuthStatus,       // Current auth status of each user
    lockedUsers: set User,          // Set of currently locked users
    usedCodes: User -> set RecoveryCode // Track used recovery codes
}

 //Helper: Ordering module for trace
//open util/ordering[SystemState]

/* 
 * --------------------------------------------------------------------------------
 * Predicates (Operations / Transitions)
 * --------------------------------------------------------------------------------
 */

// Initial State
pred Init [s: SystemState] {
    // All users start unauthenticated
    all u: User | s.auth[u] = Unauthenticated
    // No users are locked initially
    no s.lockedUsers
    // No codes used initially
    no s.usedCodes
}

// Operation: Login with Password
// Precondition: User is not locked
// Postcondition: If password matches, state becomes PendingMFA (if MFA on) or Authenticated
pred Login [s, sNext: SystemState, u: User, p: Password] {
    // Guards
    u not in s.lockedUsers
    u.password = p
    
    // Transition Logic
    (u.mfaEnabled = True) => {
        // If MFA enabled, go to PendingMFA
        sNext.auth = s.auth ++ (u -> PendingMFA)
    } else {
        // If MFA disabled, go directly to Authenticated
        sNext.auth = s.auth ++ (u -> Authenticated)
    }
    
    // Frame conditions (unchanged variables)
    sNext.lockedUsers = s.lockedUsers
    sNext.usedCodes = s.usedCodes 
}

// Operation: Verify MFA
// Precondition: User is in PendingMFA state, Secret matches
// Postcondition: User becomes Authenticated
pred VerifyMFA [s, sNext: SystemState, u: User, sec: Secret] {
    // Guards
    s.auth[u] = PendingMFA
    u.mfaSecret = sec
    
    // Transition
    sNext.auth = s.auth ++ (u -> Authenticated)
    
    // Frame
    sNext.lockedUsers = s.lockedUsers
    sNext.usedCodes = s.usedCodes
}

// Operation: Lock Account (e.g. after failed attempts)
pred LockAccount [s, sNext: SystemState, u: User] {
    // Transition
    sNext.lockedUsers = s.lockedUsers + u
    
    // Frame (force logout for locked user)
    sNext.auth = s.auth ++ (u -> Unauthenticated)
    sNext.usedCodes = s.usedCodes
}

// Operation: No Operation (Stutter step)
pred NoOp [s, sNext: SystemState] {
    sNext.auth = s.auth
    sNext.lockedUsers = s.lockedUsers
    sNext.usedCodes = s.usedCodes
}

// Trace Fact: Constrains the sequence of states
fact Trace {
    // 1. First state must satisfy Init
    first.Init
    
    // 2. Every state must transition to the next via a valid operation
    all s: SystemState - last | let sNext = s.next |
        (some u: User, p: Password, sec: Secret |
            Login[s, sNext, u, p] or
            VerifyMFA[s, sNext, u, sec] or
            LockAccount[s, sNext, u])
        or NoOp[s, sNext]
}

/* 
 * --------------------------------------------------------------------------------
 * Assertions (Security Properties)
 * --------------------------------------------------------------------------------
 */

// 1. Authorization Bypass: 
// A user with MFA enabled should never be Authenticated without having passed through PendingMFA.
assert NoMFABypass {
    all s: SystemState, u: User |
        (u.mfaEnabled = True and s.auth[u] = Authenticated) implies
            (some sPrev: SystemState | sPrev.next = s and sPrev.auth[u] = PendingMFA)
}

// 2. Locked User Login
// A locked user should not be able to become Authenticated.
assert LockedCannotLogin {
    all s: SystemState, u: User |
        u in s.lockedUsers implies s.auth[u] != Authenticated
}

/* 
 * --------------------------------------------------------------------------------
 * Commands to Run
 * --------------------------------------------------------------------------------
 */

// Check assertions
check NoMFABypass for 5 but 3 User, 3 Password, 3 Secret
check LockedCannotLogin for 5 but 3 User

// Generate an instance to visualize a successful login flow
pred SuccessfulLogin {
    some s: SystemState, u: User | 
        u.mfaEnabled = True and s.auth[u] = Authenticated
}
run SuccessfulLogin for 5 but 3 User
