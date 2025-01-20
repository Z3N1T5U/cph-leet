#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    int n = nums.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) {
                return {i, j};
            }
        }
    }
    return {}; // No solution found
}

int main() {
    vector<int> nums;
    int target;
 

    vector<int> result = twoSum(nums, target);

    if (result.empty()) {
        cout << "No solution found." << endl;
    } else {
        cout << result[0] << ", " << result[1] << endl;
    }

    return 0;
}
