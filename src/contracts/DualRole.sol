// contract address : 0xc8e17B92E580efBdb0f52772D00aC9DbcB2d0ae6
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract Web3WorkProfiles {
    // Track both profile types
    mapping(address => string) private _freelancerCIDs; // Individual freelancer profile
    mapping(address => string) private _clientCIDs; // Company/client profile
    mapping(address => address) private _profileOwners;

    // Add profile type to event
    enum ProfileType {
        Freelancer,
        Client
    }
    event ProfileUpdated(
        address indexed user,
        ProfileType profileType,
        string cid,
        uint256 timestamp
    );

    // Update specific profile type
    function updateFreelancerProfileCID(string calldata cid) external {
        _freelancerCIDs[msg.sender] = cid;
        _profileOwners[msg.sender] = msg.sender;
        emit ProfileUpdated(
            msg.sender,
            ProfileType.Freelancer,
            cid,
            block.timestamp
        );
    }

    function updateClientProfileCID(string calldata cid) external {
        _clientCIDs[msg.sender] = cid;
        _profileOwners[msg.sender] = msg.sender;
        emit ProfileUpdated(
            msg.sender,
            ProfileType.Client,
            cid,
            block.timestamp
        );
    }

    // Get specific profile type
    function getFreelancerCID(
        address user
    ) external view returns (string memory) {
        require(_profileOwners[user] == user, "Profile not registered");
        return _freelancerCIDs[user];
    }

    function getClientCID(address user) external view returns (string memory) {
        require(_profileOwners[user] == user, "Profile not registered");
        return _clientCIDs[user];
    }

    // Transfer both profile types
    function transferProfileOwnership(address newOwner) external {
        require(_profileOwners[msg.sender] == msg.sender, "Not profile owner");

        // Transfer both CIDs
        _freelancerCIDs[newOwner] = _freelancerCIDs[msg.sender];
        _clientCIDs[newOwner] = _clientCIDs[msg.sender];

        // Clear old data
        delete _freelancerCIDs[msg.sender];
        delete _clientCIDs[msg.sender];

        _profileOwners[newOwner] = newOwner;
        _profileOwners[msg.sender] = address(0);
    }
}
