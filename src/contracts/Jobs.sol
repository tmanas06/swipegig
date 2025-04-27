// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract Web3WorkJobs {
    struct Job {
        address poster;
        string cid;
        uint256 timestamp;
        bool active;
    }

    mapping(uint256 => Job) public jobs;
    uint256 public jobCount;

    event JobPosted(uint256 indexed jobId, string cid);
    event JobClosed(uint256 indexed jobId);

    function postJob(string calldata cid) external {
        jobs[jobCount] = Job(msg.sender, cid, block.timestamp, true);
        emit JobPosted(jobCount, cid);
        jobCount++;
    }

    function closeJob(uint256 jobId) external {
        require(jobs[jobId].poster == msg.sender, "Not job poster");
        jobs[jobId].active = false;
        emit JobClosed(jobId);
    }

    function getActiveJobs() external view returns (string[] memory) {
        string[] memory activeJobs = new string[](jobCount);
        uint256 count = 0;

        for (uint256 i = 0; i < jobCount; i++) {
            if (jobs[i].active) {
                activeJobs[count] = jobs[i].cid;
                count++;
            }
        }

        // Resize array to remove empty elements
        string[] memory result = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeJobs[i];
        }
        return result;
    }
}
