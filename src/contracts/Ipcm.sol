// Contract address: 0xbC51f02232164396a7a9167878c8463EbC7de0D4
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract Web3WorkProfiles {
    // Maps user addresses to their latest profile CID
    mapping(address => string) private _profileCIDs;

    // Tracks ownership of profile CIDs
    mapping(address => address) private _profileOwners;

    // Emitted when a profile CID is updated
    event ProfileUpdated(address indexed user, string cid, uint256 timestamp);

    // Update caller's profile CID (IPCM core functionality)
    function updateProfileCID(string calldata cid) external {
        _profileCIDs[msg.sender] = cid;
        _profileOwners[msg.sender] = msg.sender; // Track ownership
        emit ProfileUpdated(msg.sender, cid, block.timestamp);
    }

    // Get latest CID for any address (IPCM-style access)
    function getProfileCID(address user) external view returns (string memory) {
        require(_profileOwners[user] == user, "Profile not registered");
        return _profileCIDs[user];
    }

    // Optional: Transfer profile ownership
    function transferProfileOwnership(address newOwner) external {
        require(_profileOwners[msg.sender] == msg.sender, "Not profile owner");
        _profileOwners[newOwner] = newOwner;
        _profileOwners[msg.sender] = address(0);
    }
}
