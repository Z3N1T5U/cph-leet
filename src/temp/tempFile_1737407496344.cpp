#include <bits/stdc++.h>

using namespace std;

class Solution {
 public:
  vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> numToIndex;

    for (int i = 0; i < nums.size(); ++i) {
      // Declare the iterator explicitly before the if condition
      auto it = numToIndex.find(target - nums[i]);
      if (it != numToIndex.cend()) {
        return {it->second, i};
      }
      numToIndex[nums[i]] = i;
    }

    throw runtime_error("No solution found.");
  }
};

int main() {
    Solution solution;
    
    // Example input (you can replace these values as needed)
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;

    try {
        vector<int> result = solution.twoSum(nums, target);
        cout << "[" << result[0] << ", " << result[1] << "]" << endl;
    } catch (const exception& e) {
        cout << e.what() << endl;
    }

    return 0;
}
